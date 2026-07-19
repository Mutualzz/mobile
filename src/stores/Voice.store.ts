import { Logger } from "@mutualzz/logger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable, observable, reaction, runInAction } from "mobx";
import { makePersistable } from "mobx-persist-store";
import type { Snowflake, VoiceState as ApiVoiceState } from "@mutualzz/types";
import { ImageFormat } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { Space } from "@stores/objects/Space";
import { VoiceState } from "@stores/objects/VoiceState";
import { MediasoupSession } from "@stores/voice/MediasoupSession";
import {
  parseMediaDeviceList,
  parseMutedUserIds,
  parseVolumeMap,
  type VoiceMediaDevice,
} from "@stores/voice/webrtcBridge";
import {
  clampUserVolume,
  DEFAULT_VOICE_INPUT_SENSITIVITY,
  sensitivityToThreshold,
  type VoiceInputMode,
} from "@utils/voiceSettings.utils";
import { fixConnectionUrl } from "@utils/urls";
import {
  registerAndroidVoiceForegroundService,
  setAndroidVoiceNotificationActionHandler,
  startAndroidVoiceForegroundService,
  stopAndroidVoiceForegroundService,
} from "@utils/androidVoiceForegroundService";
import {
  activateVoiceAudioSession,
  deactivateVoiceAudioSession,
} from "@utils/voiceAudioSession";
import {
  bindVoiceLiveActivityHandlers,
  endVoiceLiveActivity,
  startOrUpdateVoiceLiveActivity,
  updateVoiceLiveActivity,
} from "@utils/voiceLiveActivity";
import { resolveVoiceLiveActivityIcon } from "@utils/voiceLiveActivityIcon";
import { getVoiceLiveActivityThemeColors } from "@utils/voiceLiveActivityTheme";
import { ensureVoiceMicPermission } from "@utils/voicePermissions";
import { AppState, type AppStateStatus } from "react-native";
import type { MediaStream } from "react-native-webrtc";
import { mediaDevices } from "react-native-webrtc";
import i18n from "../i18n";
import { Channel } from "@stores/objects/Channel";

export type VoiceConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "failed";

interface VoiceServerUpdatePayload {
  roomId?: string;
  spaceId?: Snowflake | null;
  channelId: Snowflake;
  voiceEndpoint: string;
  voiceToken: string;
  sessionId: string;
}

interface VoiceTarget {
  spaceId?: Snowflake | null;
  channelId: Snowflake;
}

interface VoiceStateSyncPayload {
  channelId: Snowflake;
  states: {
    userId: Snowflake;
    spaceId?: Snowflake | null;
    channelId?: Snowflake | null;
    selfMute: boolean;
    selfDeaf: boolean;
    spaceMute: boolean;
    spaceDeaf: boolean;
    sessionId: string;
    updatedAt: number;
    joinedAt: number;
  }[];
}

const VOICE_JOIN_TIMEOUT_MS = 30_000;

function serializeVolumeMap(value: unknown) {
  if (!(value instanceof Map)) return {};
  return Object.fromEntries(value.entries());
}

function deserializeVolumeMap(value: unknown) {
  return observable.map<string, number>(parseVolumeMap(value));
}

function serializeMutedUsers(value: unknown) {
  if (!(value instanceof Map)) return [];
  return Array.from(value.entries())
    .filter(([, muted]) => muted)
    .map(([userId]) => userId);
}

function deserializeMutedUsers(value: unknown) {
  return observable.map<string, boolean>(
    parseMutedUserIds(value).map((userId) => [userId, true]),
  );
}

export class VoiceStore {
  connectionStatus: VoiceConnectionStatus = "idle";
  connectionError: string | null = null;
  currentVoiceTarget: VoiceTarget | null = null;
  currentSessionId: string | null = null;
  selfMute = false;
  selfDeaf = false;
  spaceMute = false;
  spaceDeaf = false;
  cameraEnabled = false;
  currentInputDeviceId: string | null = null;
  currentCameraDeviceId: string | null = null;
  inputs = observable.array<VoiceMediaDevice>([]);
  cameras = observable.array<VoiceMediaDevice>([]);
  remoteCameraStreams = observable.map<string, MediaStream>();
  speakingUsers = observable.map<string, boolean>();
  userVoiceVolumeByUser = observable.map<string, number>();
  userVoiceMutedByUser = observable.map<string, boolean>();
  voiceInputSensitivity = DEFAULT_VOICE_INPUT_SENSITIVITY;
  voiceInputSensitivityAuto = true;
  voiceInputMode: VoiceInputMode = "voice_activity";
  noiseSuppression = true;
  noiseSuppressionPending = false;
  pushToTalkActive = false;

  private pendingEndpoint: string | null = null;
  private pendingToken: string | null = null;
  private joinPrepPromise: Promise<void> | null = null;
  private readonly session: MediasoupSession;
  private readonly logger = new Logger({ tag: "VoiceStore" });
  private abortController: AbortController | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private joinTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private cameraProducerByUser = new Map<string, string>();
  private channelSwitchInProgress = false;
  private cameraSuspendedByBackground = false;
  private readonly appStateSubscription = AppState.addEventListener(
    "change",
    (nextState) => this.handleAppStateChange(nextState),
  );

  constructor(private readonly app: AppStore) {
    registerAndroidVoiceForegroundService();
    const voiceLiveActivityHandlers = {
      toggleMute: () => this.setMute(!this.selfMute),
      toggleDeaf: () => this.setDeaf(!this.selfDeaf),
      disconnect: () => {
        void this.hangupCurrentDmCall();
      },
    };
    bindVoiceLiveActivityHandlers(voiceLiveActivityHandlers);
    setAndroidVoiceNotificationActionHandler((action) => {
      if (action === "mute") {
        this.setMute(!this.selfMute);
        return;
      }
      if (action === "deafen") {
        this.setDeaf(!this.selfDeaf);
        return;
      }
      if (action === "disconnect") {
        void this.hangupCurrentDmCall();
      }
    });
    reaction(
      () => ({
        themeId:
          this.app.settings?.currentTheme ??
          this.app.themes?.currentTheme ??
          null,
        connected: this.connectionStatus === "connected",
      }),
      ({ connected }) => {
        if (!connected) return;
        void this.syncVoicePresenceUi();
      },
    );

    this.session = new MediasoupSession({
      callbacks: {
        onSocketClosed: (reason) => {
          const reasonLower = String(reason ?? "").toLowerCase();
          if (reasonLower.includes("moved to another voice channel")) {
            runInAction(() => {
              this.channelSwitchInProgress = true;
              this.connectionStatus = "connecting";
              this.connectionError = null;
            });
            this.abortAndTeardown();
            this.stopKeepAlive();
            this.startJoinTimeout();
            return;
          }
          const isSuperseded =
            reasonLower.includes("superseded") ||
            reasonLower.includes("minecraft") ||
            reasonLower.includes("different device");
          const canAutoRejoin =
            !isSuperseded &&
            this.connectionStatus === "connected" &&
            !!this.currentVoiceTarget &&
            this.app.isGatewayReady &&
            (this.currentVoiceTarget.spaceId != null ||
              !!this.app.calls.getCall(this.currentVoiceTarget.channelId));
          runInAction(() => {
            this.connectionError = canAutoRejoin
              ? null
              : (reason ?? i18n.t("voice.errors.closed", { ns: "chat" }));
            this.cameraEnabled = false;
            if (!canAutoRejoin) {
              this.connectionStatus = "idle";
              this.currentVoiceTarget = null;
            }
          });
          this.abortAndTeardown();
          this.stopKeepAlive();
          if (!canAutoRejoin) {
            void this.teardownVoicePresenceUi();
          }
          if (canAutoRejoin) {
            void this.reconnectVoice();
          }
        },
        onRemoteCameraStream: (userId, producerId, stream) => {
          runInAction(() => {
            if (stream) {
              this.remoteCameraStreams.set(userId, stream);
              this.cameraProducerByUser.set(userId, producerId);
            } else {
              const activeProducerId = this.cameraProducerByUser.get(userId);
              if (!activeProducerId || activeProducerId === producerId) {
                this.remoteCameraStreams.delete(userId);
                this.cameraProducerByUser.delete(userId);
              }
            }
          });
        },
        onMicFailed: () => {
          runInAction(() => {
            this.selfMute = true;
          });
          void this.sendVoiceStateUpdate();
        },
        onSpeakingChange: (userId, speaking) => {
          this.setUserSpeaking(userId, speaking);
        },
        onAudioConsumerReady: (userId) => {
          this.syncUserAudioMix(userId);
        },
      },
      getSelfUserId: () => this.app.account?.id,
      getSpeakingThreshold: () => this.getSpeakingThreshold(),
      shouldReportSpeaking: (userId) =>
        this.shouldReportSpeakingForUser(userId),
      getNoiseSuppression: () => this.noiseSuppression,
      getUserAudioMix: (userId) => ({
        muted: this.isUserVoiceMuted(userId),
        volume: this.getUserVoiceVolume(userId),
      }),
    });

    makeAutoObservable(this, {}, { autoBind: true });

    void makePersistable(this, {
      name: "VoiceStore",
      properties: [
        "voiceInputSensitivity",
        "voiceInputSensitivityAuto",
        "voiceInputMode",
        "noiseSuppression",
        "currentInputDeviceId",
        "currentCameraDeviceId",
        {
          key: "userVoiceVolumeByUser",
          serialize: serializeVolumeMap,
          deserialize: deserializeVolumeMap,
        },
        {
          key: "userVoiceMutedByUser",
          serialize: serializeMutedUsers,
          deserialize: deserializeMutedUsers,
        },
      ],
      storage: AsyncStorage,
    });
  }

  get isConnected() {
    return this.connectionStatus === "connected";
  }

  get currentChannelId() {
    return this.currentVoiceTarget?.channelId ?? null;
  }

  get currentSpaceId() {
    return this.currentVoiceTarget?.spaceId ?? null;
  }

  isJoinedToChannel(channelId: Snowflake) {
    return (
      this.currentVoiceTarget?.channelId === channelId &&
      (this.connectionStatus === "connecting" ||
        this.connectionStatus === "connected")
    );
  }

  get channel() {
    const channelId = this.currentChannelId;
    if (!channelId) return null;
    return this.app.channels.get(channelId) ?? null;
  }

  get hasActiveVoiceTarget() {
    return !!this.currentVoiceTarget;
  }

  private matchesVoiceTarget(
    target: VoiceTarget | null | undefined,
    payload: Pick<VoiceServerUpdatePayload, "spaceId" | "channelId">,
  ) {
    if (!target) return false;
    return (
      String(target.spaceId ?? null) === String(payload.spaceId ?? null) &&
      String(target.channelId) === String(payload.channelId)
    );
  }

  private shouldAcceptVoiceServerUpdate(payload: VoiceServerUpdatePayload) {
    if (this.matchesVoiceTarget(this.currentVoiceTarget, payload)) return true;

    if (this.currentVoiceTarget) return false;

    const selfId = this.app.account?.id;
    const selfState = selfId ? this.app.voiceStates.get(selfId) : null;
    if (selfState?.channelId) {
      if (
        payload.spaceId == null &&
        !this.app.calls.getCall(payload.channelId)
      ) {
        return false;
      }
      return this.matchesVoiceTarget(
        {
          spaceId: selfState.spaceId ?? null,
          channelId: selfState.channelId,
        },
        payload,
      );
    }

    if (
      payload.spaceId == null &&
      this.connectionStatus === "connecting" &&
      this.app.calls.getCall(payload.channelId)
    ) {
      return true;
    }

    return false;
  }

  get canUseVadInCurrentChannel() {
    const channel = this.channel;
    if (!channel?.spaceId) return true;
    const space = this.app.spaces.get(channel.spaceId);
    return space?.members.me?.canUseVad(channel) ?? true;
  }

  get effectiveVoiceInputMode(): VoiceInputMode {
    if (!this.canUseVadInCurrentChannel) return "push_to_talk";
    return this.voiceInputMode;
  }

  get effectiveSelfMute() {
    if (this.spaceMute || this.spaceDeaf) return true;
    if (this.selfDeaf) return true;
    return this.selfMute;
  }

  get effectiveSelfDeaf() {
    return this.spaceDeaf || this.selfDeaf;
  }

  getLocalCameraStream() {
    return this.session.getLocalCameraStream();
  }

  getCameraStreamForUser(userId: Snowflake) {
    if (userId === this.app.account?.id) {
      return this.session.getLocalCameraStream();
    }
    return this.remoteCameraStreams.get(userId) ?? null;
  }

  isUserSpeaking(userId: string) {
    return this.speakingUsers.get(userId) ?? false;
  }

  getUserVoiceVolume(userId: string) {
    return this.userVoiceVolumeByUser.get(userId) ?? 100;
  }

  setUserVoiceVolume(userId: string, volume: number) {
    const clamped = clampUserVolume(volume);
    runInAction(() => {
      if (clamped === 100) {
        this.userVoiceVolumeByUser.delete(userId);
      } else {
        this.userVoiceVolumeByUser.set(userId, clamped);
      }
    });
    this.syncUserAudioMix(userId);
  }

  isUserVoiceMuted(userId: string) {
    return this.userVoiceMutedByUser.get(userId) ?? false;
  }

  setUserVoiceMuted(userId: string, muted: boolean) {
    runInAction(() => {
      if (muted) {
        this.userVoiceMutedByUser.set(userId, true);
      } else {
        this.userVoiceMutedByUser.delete(userId);
      }
    });
    this.syncUserAudioMix(userId);
  }

  toggleUserVoiceMuted(userId: string) {
    this.setUserVoiceMuted(userId, !this.isUserVoiceMuted(userId));
  }

  setVoiceInputSensitivity(value: number) {
    this.voiceInputSensitivity = Math.min(100, Math.max(0, Math.round(value)));
  }

  setVoiceInputSensitivityAuto(value: boolean) {
    this.voiceInputSensitivityAuto = value;
  }

  setVoiceInputMode(mode: VoiceInputMode) {
    this.voiceInputMode = mode;
    if (mode === "voice_activity") {
      this.setPushToTalkPressed(false);
    }
    this.applyVoiceSettings();
  }

  async setNoiseSuppression(enabled: boolean) {
    if (this.noiseSuppression === enabled) return;
    runInAction(() => {
      this.noiseSuppression = enabled;
    });
    if (
      this.connectionStatus !== "connected" ||
      !this.abortController ||
      this.noiseSuppressionPending
    ) {
      return;
    }
    runInAction(() => {
      this.noiseSuppressionPending = true;
    });
    try {
      await this.session.restartMic(this.abortController.signal);
    } catch (error) {
      this.logger.warn(
        "restartMic after noise suppression toggle failed",
        error,
      );
    } finally {
      runInAction(() => {
        this.noiseSuppressionPending = false;
      });
    }
  }

  setPushToTalkPressed(pressed: boolean) {
    if (this.effectiveVoiceInputMode !== "push_to_talk") return;
    if (this.pushToTalkActive === pressed) return;
    this.pushToTalkActive = pressed;
    if (!this.isRtcConnected) return;

    try {
      this.session.setPushToTalkPressed(pressed);
      this.app.sounds.play(pressed ? "ptt_start" : "ptt_stop");
    } catch (error) {
      this.logger.warn("Failed to apply push-to-talk state", error);
    }
  }

  get isPushToTalkMode() {
    return this.effectiveVoiceInputMode === "push_to_talk";
  }

  private get isRtcConnected() {
    return this.connectionStatus === "connected";
  }

  private applySessionVoiceFlags() {
    if (!this.isRtcConnected) return;

    try {
      this.session.setSpaceMute(this.spaceMute);
      this.session.setSelfMute(this.selfMute);
      this.session.setSelfDeaf(this.selfDeaf);
    } catch (error) {
      this.logger.warn("Failed to apply voice flags to RTC session", error);
    }
  }

  applyVoiceSettings() {
    if (!this.isRtcConnected) return;

    try {
      this.session.setInputMode(this.effectiveVoiceInputMode);
      this.session.setSpaceMute(this.spaceMute);
    } catch (error) {
      this.logger.warn("Failed to apply voice settings to RTC session", error);
    }
  }

  private getSpeakingThreshold() {
    return sensitivityToThreshold(
      this.voiceInputSensitivity,
      this.voiceInputSensitivityAuto,
    );
  }

  private shouldReportSpeakingForUser(userId: string) {
    const accountId = this.app.account?.id;
    if (userId !== accountId) return true;
    if (this.effectiveSelfMute) return false;
    if (this.effectiveVoiceInputMode === "push_to_talk") {
      return this.pushToTalkActive;
    }
    return true;
  }

  private setUserSpeaking(userId: string, speaking: boolean) {
    runInAction(() => {
      const accountId = this.app.account?.id;
      if (userId === accountId && this.effectiveSelfMute) {
        if (!speaking) this.speakingUsers.delete(userId);
        return;
      }
      if (speaking) this.speakingUsers.set(userId, true);
      else this.speakingUsers.delete(userId);
    });
  }

  private syncUserAudioMix(userId: string) {
    if (!this.isRtcConnected) return;

    this.session.applyAudioForUser(userId, {
      muted: this.isUserVoiceMuted(userId),
      volume: this.getUserVoiceVolume(userId),
    });
  }

  async setupDevices(requestPermissions = false) {
    try {
      if (requestPermissions) {
        const initialDevices = parseMediaDeviceList(
          await mediaDevices.enumerateDevices(),
        );
        const hasLabels = initialDevices.some(
          (device) => device.label.length > 0,
        );

        if (!hasLabels) {
          try {
            const tmp = await mediaDevices.getUserMedia({
              audio: true,
            });
            tmp.getTracks().forEach((track) => {
              try {
                track.stop();
              } catch {}
            });
          } catch {}
        }
      }

      const devices = parseMediaDeviceList(
        await mediaDevices.enumerateDevices(),
      );
      const audioInputs = devices.filter(
        (device) => device.kind === "audioinput",
      );
      const videoInputs = devices.filter(
        (device) => device.kind === "videoinput",
      );

      runInAction(() => {
        this.inputs.replace(audioInputs);
        this.cameras.replace(videoInputs);
        this.currentInputDeviceId =
          this.currentInputDeviceId &&
          audioInputs.some(
            (device) => device.deviceId === this.currentInputDeviceId,
          )
            ? this.currentInputDeviceId
            : (audioInputs[0]?.deviceId ?? null);
        this.currentCameraDeviceId =
          this.currentCameraDeviceId &&
          videoInputs.some(
            (device) => device.deviceId === this.currentCameraDeviceId,
          )
            ? this.currentCameraDeviceId
            : (videoInputs[0]?.deviceId ?? null);
      });
    } catch (error) {
      runInAction(() => {
        this.connectionError =
          error instanceof Error
            ? error.message
            : i18n.t("voice.errors.enumerateDevices", { ns: "chat" });
      });
    }
  }

  async join(target: VoiceTarget) {
    const isSame =
      this.currentVoiceTarget?.spaceId === (target.spaceId ?? null) &&
      this.currentVoiceTarget?.channelId === target.channelId;
    if (isSame && this.connectionStatus !== "failed") return;

    if (this.currentVoiceTarget && !isSame) {
      this.clearJoinTimeout();
      this.abortAndTeardown();
      this.stopKeepAlive();
    }

    const preferredSelfMute = this.app.settings?.preferredSelfMute ?? false;
    const preferredSelfDeaf = this.app.settings?.preferredSelfDeaf ?? false;
    const selfDeaf = preferredSelfDeaf;
    const selfMute = preferredSelfMute || preferredSelfDeaf;

    this.pendingEndpoint = null;
    this.pendingToken = null;

    runInAction(() => {
      this.currentVoiceTarget = {
        spaceId: target.spaceId ?? null,
        channelId: target.channelId,
      };
      this.connectionStatus = "connecting";
      this.connectionError = null;
      this.selfMute = selfMute;
      this.selfDeaf = selfDeaf;
    });

    this.joinPrepPromise = this.setupDevices(true)
      .then(async () => {
        const hasMicPermission = await ensureVoiceMicPermission();
        if (!hasMicPermission) {
          throw new Error(
            i18n.t("voice.errors.micPermissionRequired", { ns: "chat" }),
          );
        }
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : i18n.t("voice.errors.micPermissionRequired", { ns: "chat" });
        this.clearJoinTimeout();
        this.stopKeepAlive();
        runInAction(() => {
          this.connectionError = message;
          this.connectionStatus = "failed";
          this.currentVoiceTarget = null;
        });
        throw error;
      });

    this.startJoinTimeout();
    await this.sendVoiceStateUpdate({ refreshRtc: true });
  }

  primeJoin(target: VoiceTarget) {
    const isSame =
      this.currentVoiceTarget?.spaceId === (target.spaceId ?? null) &&
      this.currentVoiceTarget?.channelId === target.channelId;

    if (this.currentVoiceTarget && !isSame) {
      this.clearJoinTimeout();
      this.abortAndTeardown();
      this.stopKeepAlive();
    }

    const preferredSelfMute = this.app.settings?.preferredSelfMute ?? false;
    const preferredSelfDeaf = this.app.settings?.preferredSelfDeaf ?? false;
    const selfDeaf = preferredSelfDeaf;
    const selfMute = preferredSelfMute || preferredSelfDeaf;

    runInAction(() => {
      this.currentVoiceTarget = {
        spaceId: target.spaceId ?? null,
        channelId: target.channelId,
      };
      this.connectionStatus = "connecting";
      this.connectionError = null;
      this.selfMute = selfMute;
      this.selfDeaf = selfDeaf;
    });

    this.startJoinTimeout();
  }

  async joinChannel(channelId: Snowflake, spaceId?: Snowflake | null) {
    await this.join({ channelId, spaceId: spaceId ?? null });
  }

  async hangupCurrentDmCall() {
    const target = this.currentVoiceTarget;
    if (target != null && target.spaceId == null) {
      const channelId = target.channelId;
      const call = this.app.calls.getCall(channelId);
      const selfId = this.app.account?.id
        ? String(this.app.account.id)
        : null;
      const othersInVoice = this.app.voiceStates
        .getAllByChannel(channelId)
        .filter((state) => !selfId || String(state.userId) !== selfId);

      if (othersInVoice.length === 0) {
        await this.app.calls.endOnVoiceLeave(channelId);
      } else if (
        call &&
        selfId &&
        String(call.initiatorId) !== selfId &&
        (call.accepted.includes(selfId) || call.ringing.includes(selfId))
      ) {
        await this.app.calls.abandon(channelId);
      }
    }
    await this.leave({ skipCallCleanup: true });
  }

  async leave(options?: { skipCallCleanup?: boolean }) {
    if (this.connectionStatus === "failed" && !this.currentVoiceTarget) {
      runInAction(() => {
        this.connectionStatus = "idle";
        this.connectionError = null;
      });
      return;
    }

    const shouldPlayDisconnect =
      this.connectionStatus === "connected" ||
      this.connectionStatus === "connecting";

    this.clearJoinTimeout();
    this.abortAndTeardown();
    this.stopKeepAlive();
    this.cameraSuspendedByBackground = false;

    const selfId = this.app.account?.id;
    const selfState = selfId ? this.app.voiceStates.get(selfId) : null;
    const minecraftOwns =
      selfState?.client === "minecraft" && !!selfState.channelId;
    const leavingDmCall =
      this.currentVoiceTarget?.spaceId == null &&
      !!this.currentVoiceTarget?.channelId
        ? String(this.currentVoiceTarget.channelId)
        : null;

    runInAction(() => {
      this.connectionStatus = "idle";
      this.connectionError = null;
      this.currentVoiceTarget = null;
      this.currentSessionId = null;
      this.pendingEndpoint = null;
      this.pendingToken = null;
      this.channelSwitchInProgress = false;
      this.cameraEnabled = false;
      this.spaceMute = false;
      this.spaceDeaf = false;
      this.remoteCameraStreams.clear();
      this.speakingUsers.clear();
      this.pushToTalkActive = false;
    });
    this.cameraProducerByUser.clear();

    void this.teardownVoicePresenceUi();

    if (minecraftOwns) return;

    if (selfId) {
      this.app.voiceStates.remove(selfId);
    }

    if (leavingDmCall && !options?.skipCallCleanup) {
      await this.app.calls.endOnVoiceLeave(leavingDmCall);
    }

    if (shouldPlayDisconnect) {
      this.app.sounds.play("call_disconnect");
    }

    void this.sendVoiceStateUpdate();
  }

  async leaveChannel() {
    await this.leave();
  }

  onRemoteCallEnded(channelId: Snowflake) {
    if (
      !this.currentVoiceTarget ||
      String(this.currentVoiceTarget.channelId) !== String(channelId)
    ) {
      return;
    }

    const shouldPlayDisconnect =
      this.connectionStatus === "connected" ||
      this.connectionStatus === "connecting";

    this.clearJoinTimeout();
    this.abortAndTeardown();
    this.stopKeepAlive();
    this.cameraSuspendedByBackground = false;
    void this.teardownVoicePresenceUi();

    const selfId = this.app.account?.id;
    if (selfId) {
      this.app.voiceStates.remove(selfId);
    }

    runInAction(() => {
      this.connectionStatus = "idle";
      this.connectionError = null;
      this.currentVoiceTarget = null;
      this.currentSessionId = null;
      this.pendingEndpoint = null;
      this.pendingToken = null;
      this.channelSwitchInProgress = false;
      this.cameraEnabled = false;
      this.remoteCameraStreams.clear();
      this.speakingUsers.clear();
      this.pushToTalkActive = false;
    });
    this.cameraProducerByUser.clear();

    if (shouldPlayDisconnect) {
      this.app.sounds.play("call_disconnect");
    }
  }

  clear() {
    this.clearJoinTimeout();
    this.abortAndTeardown();
    this.stopKeepAlive();
    void this.teardownVoicePresenceUi();
    this.pendingEndpoint = null;
    this.pendingToken = null;
    this.connectionStatus = "idle";
    this.connectionError = null;
    this.currentVoiceTarget = null;
    this.currentSessionId = null;
    this.cameraEnabled = false;
    this.remoteCameraStreams.clear();
    this.cameraProducerByUser.clear();
    this.speakingUsers.clear();
  }

  onGatewayDisconnected() {
    this.stopKeepAlive();
  }

  onGatewayReconnected() {
    const selfId = this.app.account?.id;
    const selfState = selfId ? this.app.voiceStates.get(selfId) : null;

    if (
      !this.currentVoiceTarget &&
      selfState?.channelId &&
      selfState.spaceId == null &&
      selfState.client !== "minecraft" &&
      !this.app.calls.getCall(selfState.channelId)
    ) {
      if (selfId) this.app.voiceStates.remove(selfId);
      void this.app.gateway.sendVoiceStateUpdate({
        spaceId: null,
        channelId: null,
        selfMute: this.selfMute,
        selfDeaf: this.selfDeaf,
      });
      return;
    }

    if (!this.currentVoiceTarget) return;

    if (selfState?.client === "minecraft" && selfState.channelId) {
      try {
        this.abortAndTeardown();
      } catch {}
      this.stopKeepAlive();
      this.clearJoinTimeout();
      void this.teardownVoicePresenceUi();
      runInAction(() => {
        this.connectionStatus = "idle";
        this.connectionError = null;
        this.currentVoiceTarget = null;
        this.cameraEnabled = false;
        this.pushToTalkActive = false;
      });
      return;
    }

    if (
      this.currentVoiceTarget.spaceId == null &&
      !this.app.calls.getCall(this.currentVoiceTarget.channelId)
    ) {
      this.onRemoteCallEnded(this.currentVoiceTarget.channelId);
      return;
    }

    if (this.connectionStatus === "connected") {
      this.startKeepAlive();
      void this.sendVoiceStateUpdate();
      return;
    }

    void this.reconnectVoice();
  }

  onVoiceServerUpdate(payload: VoiceServerUpdatePayload) {
    if (!this.shouldAcceptVoiceServerUpdate(payload)) return;

    if (!payload.voiceEndpoint?.trim()) {
      this.failJoin(i18n.t("voice.errors.notConfigured", { ns: "chat" }));
      return;
    }

    this.pendingEndpoint = payload.voiceEndpoint;
    this.pendingToken = payload.voiceToken;

    runInAction(() => {
      this.channelSwitchInProgress = true;
      this.currentVoiceTarget = {
        spaceId: payload.spaceId ?? null,
        channelId: payload.channelId,
      };
      this.currentSessionId = payload.sessionId;
      this.connectionStatus = "connecting";
      this.connectionError = null;
    });

    this.startJoinTimeout();
    void this.startConnection();
  }

  onVoiceStateSync(payload: VoiceStateSyncPayload) {
    const channelId = String(payload.channelId);
    for (const state of payload.states) {
      this.syncSelfFromState(state);
      this.app.voiceStates.upsert(state);
    }

    const synced = new Set(payload.states.map((state) => String(state.userId)));
    for (const existing of this.app.voiceStates.getAllByChannel(channelId)) {
      if (!synced.has(String(existing.userId))) {
        this.app.voiceStates.remove(existing.userId);
      }
    }
  }

  private playRemoteVoiceMemberSound(
    userId: string,
    nextChannelId: string | null,
  ) {
    const accountId = this.app.account?.id;
    if (!accountId || userId === accountId) return;
    if (this.connectionStatus !== "connected") return;

    const myChannel = this.currentChannelId;
    if (!myChannel) return;

    const existing = this.app.voiceStates.get(userId);
    const wasInMine =
      !!existing?.channelId &&
      String(existing.channelId) === String(myChannel);
    const nowInMine =
      !!nextChannelId && String(nextChannelId) === String(myChannel);

    if (wasInMine && !nowInMine) {
      this.app.sounds.play("user_leave");
      return;
    }
    if (!wasInMine && nowInMine) {
      this.app.sounds.play("user_join");
    }
  }

  onVoiceStateUpdate(state: VoiceState) {
    const raw =
      state instanceof VoiceState
        ? {
            userId: state.userId,
            spaceId: state.spaceId,
            channelId: state.channelId,
            selfMute: state.selfMute,
            selfDeaf: state.selfDeaf,
            spaceMute: state.spaceMute,
            spaceDeaf: state.spaceDeaf,
            sessionId: state.sessionId,
            updatedAt: state.updatedAt,
            client: state.client,
            joinedAt: state.joinedAt,
          }
        : state;

    const channelId =
      raw.channelId === "null" || raw.channelId == null ? null : raw.channelId;
    const accountId = this.app.account?.id;
    const existing = this.app.voiceStates.get(raw.userId);

    if (
      channelId != null &&
      existing &&
      typeof raw.updatedAt === "number" &&
      typeof existing.updatedAt === "number" &&
      raw.updatedAt < existing.updatedAt
    ) {
      return;
    }

    this.syncSelfFromState(raw);

    if (
      accountId &&
      raw.userId === accountId &&
      raw.client === "minecraft" &&
      channelId
    ) {
      if (
        this.currentVoiceTarget ||
        this.connectionStatus === "connected" ||
        this.connectionStatus === "connecting"
      ) {
        try {
          this.abortAndTeardown();
          this.stopKeepAlive();
        } catch {}
        runInAction(() => {
          this.connectionStatus = "idle";
          this.connectionError = null;
          this.currentVoiceTarget = null;
          this.cameraEnabled = false;
        });
        void this.teardownVoicePresenceUi();
      }
    }

    if (
      !channelId &&
      raw.userId === accountId &&
      this.connectionStatus === "connecting"
    ) {
      this.failJoin(i18n.t("voice.errors.unableToJoin", { ns: "chat" }), {
        notifyServer: false,
      });
      return;
    }

    if (!channelId) {
      this.playRemoteVoiceMemberSound(raw.userId, null);
      this.app.voiceStates.remove(raw.userId);
      if (raw.userId !== accountId) {
        runInAction(() => {
          this.remoteCameraStreams.delete(raw.userId);
          this.speakingUsers.delete(raw.userId);
        });
        this.cameraProducerByUser.delete(raw.userId);
      }
      return;
    }

    this.playRemoteVoiceMemberSound(raw.userId, channelId);
    this.app.voiceStates.upsert({
      ...raw,
      channelId,
    });
  }

  setMute(value: boolean) {
    if (this.spaceMute || this.spaceDeaf) return;

    if (this.selfDeaf && !value) {
      runInAction(() => {
        this.selfDeaf = false;
        this.selfMute = false;
      });
      this.app.settings?.setPreferredSelfDeaf(false);
      this.app.settings?.setPreferredSelfMute(false);
      this.applySessionVoiceFlags();
      void this.sendVoiceStateUpdate();
      void this.syncVoicePresenceUi();
      this.app.sounds.play("deafen_off");
      return;
    }

    if (this.selfMute === value) return;

    runInAction(() => {
      this.selfMute = value;
    });
    this.app.settings?.setPreferredSelfMute(value);
    this.applySessionVoiceFlags();
    void this.sendVoiceStateUpdate();
    void this.syncVoicePresenceUi();
    this.app.sounds.play(value ? "mute_on" : "mute_off");
  }

  setDeaf(value: boolean) {
    if (this.spaceDeaf) return;
    if (this.selfDeaf === value) return;

    runInAction(() => {
      this.selfDeaf = value;
      if (value) {
        this.selfMute = true;
      }
    });

    if (value && this.app.account?.id) {
      this.setUserSpeaking(this.app.account.id, false);
    }

    this.app.settings?.setPreferredSelfDeaf(value);
    if (value) {
      this.app.settings?.setPreferredSelfMute(true);
    }

    this.applySessionVoiceFlags();

    if (!value && this.isRtcConnected && this.currentChannelId) {
      for (const member of this.app.voiceStates.getAllByChannel(
        this.currentChannelId,
      )) {
        this.syncUserAudioMix(member.userId);
      }
    }
    void this.sendVoiceStateUpdate();
    void this.syncVoicePresenceUi();
    this.app.sounds.play(value ? "deafen_on" : "deafen_off");
  }

  setInputDeviceId(deviceId: string) {
    const changed = this.currentInputDeviceId !== deviceId;
    runInAction(() => {
      this.currentInputDeviceId = deviceId;
    });
    this.session.setInputDeviceId(deviceId);
    if (
      changed &&
      this.connectionStatus === "connected" &&
      this.abortController
    ) {
      void this.session
        .restartMic(this.abortController.signal)
        .catch((error) => {
          this.logger.warn("restartMic failed", error);
        });
    }
  }

  setCameraDeviceId(deviceId: string) {
    const changed = this.currentCameraDeviceId !== deviceId;
    runInAction(() => {
      this.currentCameraDeviceId = deviceId;
    });
    this.session.setCameraDeviceId(deviceId);
    if (
      changed &&
      this.cameraEnabled &&
      this.connectionStatus === "connected" &&
      this.abortController
    ) {
      void this.session
        .restartCamera(this.abortController.signal)
        .catch((error) => {
          this.logger.warn("restartCamera failed", error);
          runInAction(() => {
            this.cameraEnabled = false;
          });
        });
    }
  }

  async toggleCamera() {
    const next = !this.cameraEnabled;
    runInAction(() => {
      this.cameraEnabled = next;
    });

    if (!next) {
      await this.session.stopCamera();
      return;
    }

    if (!this.currentCameraDeviceId) {
      const fallback = this.cameras[0]?.deviceId ?? null;
      if (fallback) {
        runInAction(() => {
          this.currentCameraDeviceId = fallback;
        });
      }
    }

    this.session.setCameraDeviceId(this.currentCameraDeviceId);

    if (this.connectionStatus === "connected" && this.abortController) {
      try {
        await this.session.startCamera(this.abortController.signal);
      } catch (error) {
        this.logger.warn("startCamera failed", error);
        runInAction(() => {
          this.cameraEnabled = false;
        });
      }
    }
  }

  private async reconnectVoice() {
    if (!this.currentVoiceTarget) return;

    runInAction(() => {
      this.connectionStatus = "connecting";
      this.connectionError = null;
    });

    this.startJoinTimeout();

    if (this.pendingEndpoint?.trim() && this.pendingToken) {
      void this.startConnection();
    } else {
      await this.sendVoiceStateUpdate({ refreshRtc: true });
    }
  }

  private async startConnection() {
    const endpoint = this.pendingEndpoint;
    const token = this.pendingToken;

    if (!endpoint || !token) {
      this.logger.warn("startConnection called with no pending credentials");
      this.failJoin(i18n.t("voice.errors.credentialsMissing", { ns: "chat" }));
      return;
    }

    this.abortAndTeardown();

    const controller = new AbortController();
    this.abortController = controller;
    const { signal } = controller;

    runInAction(() => {
      this.connectionStatus = "connecting";
      this.connectionError = null;
    });

    try {
      if (this.joinPrepPromise) {
        await this.joinPrepPromise;
        this.joinPrepPromise = null;
      }
      if (signal.aborted) return;

      this.session.setInputDeviceId(this.currentInputDeviceId);
      this.session.setCameraDeviceId(
        this.cameraEnabled ? this.currentCameraDeviceId : null,
      );
      this.session.setSpaceMute(this.spaceMute);
      this.session.setSelfMute(this.selfMute);
      this.session.setSelfDeaf(this.selfDeaf);

      try {
        await activateVoiceAudioSession();
      } catch (error) {
        this.logger.warn("activateVoiceAudioSession failed", error);
      }

      await this.session.connect(fixConnectionUrl(endpoint), token, signal);
      if (signal.aborted) return;

      runInAction(() => {
        this.connectionStatus = "connected";
        this.channelSwitchInProgress = false;
      });
      this.applySessionVoiceFlags();
      this.applyVoiceSettings();
      this.clearJoinTimeout();
      this.startKeepAlive();
      void this.activateVoicePresenceUi().catch((error) => {
        this.logger.warn(
          "activateVoicePresenceUi failed",
          error instanceof Error ? error.message : String(error),
        );
      });

      void (async () => {
        const hasMicPermission = await ensureVoiceMicPermission();
        if (!hasMicPermission || signal.aborted) return;
        try {
          await this.session.startMic(signal);
        } catch (error) {
          this.logger.warn("startMic after connect failed", error);
        }
        if (signal.aborted || !this.cameraEnabled) return;
        try {
          await this.session.startCamera(signal);
        } catch (error) {
          this.logger.warn("startCamera after connect failed", error);
          runInAction(() => {
            this.cameraEnabled = false;
          });
        }
      })();
    } catch (error) {
      if (signal.aborted) return;

      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn("Voice connection failed", message);
      this.failJoin(message);
    }
  }

  private startJoinTimeout() {
    this.clearJoinTimeout();
    this.joinTimeoutTimer = setTimeout(() => {
      if (this.connectionStatus === "connecting") {
        this.failJoin(i18n.t("voice.errors.timedOut", { ns: "chat" }));
      }
    }, VOICE_JOIN_TIMEOUT_MS);
  }

  private clearJoinTimeout() {
    if (this.joinTimeoutTimer != null) {
      clearTimeout(this.joinTimeoutTimer);
      this.joinTimeoutTimer = null;
    }
  }

  private failJoin(
    message: string,
    options: { notifyServer?: boolean } = {},
  ) {
    this.clearJoinTimeout();

    const failedTarget = this.currentVoiceTarget;
    const selfId = this.app.account?.id;

    this.abortAndTeardown();
    this.stopKeepAlive();
    this.cameraSuspendedByBackground = false;
    void this.teardownVoicePresenceUi();
    this.pendingEndpoint = null;
    this.pendingToken = null;

    if (selfId) {
      this.app.voiceStates.remove(selfId);
    }

    runInAction(() => {
      this.connectionStatus = "failed";
      this.connectionError = message;
      this.currentVoiceTarget = null;
      this.currentSessionId = null;
      this.channelSwitchInProgress = false;
      this.cameraEnabled = false;
      this.remoteCameraStreams.clear();
      this.speakingUsers.clear();
    });
    this.cameraProducerByUser.clear();

    if (options.notifyServer !== false) {
      void this.app.gateway.sendVoiceStateUpdate({
        spaceId: failedTarget?.spaceId ?? null,
        channelId: null,
        selfMute: this.effectiveSelfMute,
        selfDeaf: this.effectiveSelfDeaf,
        client: "mobile",
      });
    }

    if (failedTarget && failedTarget.spaceId == null) {
      void this.app.calls.endOnJoinFail(failedTarget.channelId);
    }
  }

  failJoinFromSystem(message: string) {
    if (
      this.connectionStatus !== "connecting" &&
      this.connectionStatus !== "failed"
    ) {
      return;
    }
    this.failJoin(message, { notifyServer: false });
  }

  private abortAndTeardown() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.session.teardown();
  }

  private syncSelfFromState(
    raw:
      | ApiVoiceState
      | (ApiVoiceState & { channelId?: Snowflake | null | "null" }),
  ) {
    const accountId = this.app.account?.id;
    if (!accountId || raw.userId !== accountId) return;

    const wasSpaceMuted = this.spaceMute || this.spaceDeaf;
    const forcedMute = raw.spaceMute ?? false;
    const forcedDeaf = raw.spaceDeaf ?? false;

    this.spaceMute = forcedMute;
    this.spaceDeaf = forcedDeaf;
    this.selfMute = this.spaceMute ? true : raw.selfMute;
    this.selfDeaf = this.spaceDeaf ? true : raw.selfDeaf;

    this.applySessionVoiceFlags();
    if (this.connectionStatus === "connected") {
      void this.syncVoicePresenceUi();
    }

    if (
      wasSpaceMuted &&
      !forcedMute &&
      !forcedDeaf &&
      this.connectionStatus === "connected" &&
      this.abortController
    ) {
      void this.session.restartMic(this.abortController.signal).catch((error) => {
        this.logger.warn("restartMic after unmute failed", error);
      });
    }
  }

  private async resolveVoiceParticipantIcons(channelId: string | null) {
    const maxVisible = 3;
    if (!channelId) {
      return { participantIconFileNames: [] as string[], participantOverflow: 0 };
    }

    const selfId = this.app.account?.id ? String(this.app.account.id) : null;
    const states = this.app.voiceStates.getAllByChannel(channelId);
    const ordered = [
      ...states.filter((state) => String(state.userId) !== selfId),
      ...states.filter((state) => String(state.userId) === selfId),
    ];

    const visible = ordered.slice(0, maxVisible);
    const participantIconFileNames: string[] = [];

    for (const state of visible) {
      const user = state.user;
      if (!user) continue;
      const fileName = await resolveVoiceLiveActivityIcon({
        cacheKey: `user-${user.id}`,
        iconUrl: user.constructAvatarUrl(false, "light", 128, ImageFormat.PNG),
      });
      if (fileName) {
        participantIconFileNames.push(fileName);
      }
    }

    return {
      participantIconFileNames,
      participantOverflow: Math.max(0, ordered.length - maxVisible),
    };
  }

  private async getVoicePresenceProps() {
    const channel = this.channel;
    const callSubtitle = i18n.t("call.inCall", { ns: "chat" });
    const participants = await this.resolveVoiceParticipantIcons(
      channel?.id ?? this.currentChannelId,
    );

    if (!channel) {
      return {
        channelName: i18n.t("voice.title", { ns: "chat" }),
        spaceName: "",
        muted: this.effectiveSelfMute === true,
        deafened: this.effectiveSelfDeaf === true,
        spaceIconFileName: "",
        ...participants,
        ...getVoiceLiveActivityThemeColors(this.app),
      };
    }

    if (channel.spaceId == null) {
      if (channel.isGroupDM) {
        const spaceName =
          channel.name?.trim() ||
          channel.dmRecipients
            ?.map((user) => user.displayName)
            .filter(Boolean)
            .join(", ") ||
          i18n.t("groupDm.title", { ns: "chat" });
        const iconUser = channel.dmRecipients?.[0] ?? null;
        const iconUrl =
          channel.icon != null
            ? Channel.constructIconUrl(
                channel.id,
                channel.icon.startsWith("a_"),
                channel.icon,
                128,
                ImageFormat.PNG,
              )
            : (iconUser?.constructAvatarUrl(
                false,
                "light",
                128,
                ImageFormat.PNG,
              ) ?? null);
        const spaceIconFileName = await resolveVoiceLiveActivityIcon({
          cacheKey: channel.icon
            ? `group-${channel.id}`
            : iconUser
              ? `user-${iconUser.id}`
              : null,
          iconUrl,
        });

        return {
          channelName: callSubtitle,
          spaceName,
          muted: this.effectiveSelfMute === true,
          deafened: this.effectiveSelfDeaf === true,
          spaceIconFileName: spaceIconFileName || "",
          ...participants,
          ...getVoiceLiveActivityThemeColors(this.app),
        };
      }

      const recipient = channel.dmRecipient ?? null;
      const spaceName =
        recipient?.displayName?.trim() ||
        channel.name?.trim() ||
        i18n.t("unknownUser", { ns: "chat" });
      const iconUrl =
        recipient?.constructAvatarUrl(false, "light", 128, ImageFormat.PNG) ??
        null;
      const spaceIconFileName = await resolveVoiceLiveActivityIcon({
        cacheKey: recipient ? `user-${recipient.id}` : null,
        iconUrl,
      });

      return {
        channelName: callSubtitle,
        spaceName,
        muted: this.effectiveSelfMute === true,
        deafened: this.effectiveSelfDeaf === true,
        spaceIconFileName: spaceIconFileName || "",
        ...participants,
        ...getVoiceLiveActivityThemeColors(this.app),
      };
    }

    const space = channel.space ?? null;
    const spaceName = space?.name?.trim() || "";
    const channelName =
      channel.name?.trim() || i18n.t("voice.title", { ns: "chat" });
    const iconUrl =
      space?.icon != null
        ? Space.constructIconUrl(
            space.id,
            space.icon.startsWith("a_"),
            space.icon,
            128,
            ImageFormat.PNG,
          )
        : null;
    const spaceIconFileName = await resolveVoiceLiveActivityIcon({
      cacheKey: space?.id ? `space-${space.id}` : null,
      iconUrl,
    });

    return {
      channelName,
      spaceName,
      muted: this.effectiveSelfMute === true,
      deafened: this.effectiveSelfDeaf === true,
      spaceIconFileName: spaceIconFileName || "",
      ...participants,
      ...getVoiceLiveActivityThemeColors(this.app),
    };
  }

  private getVoiceDeepLinkUrl() {
    const channelId = this.currentChannelId;
    if (!channelId) return "com.mutualzz.app://";
    const spaceId = this.currentVoiceTarget?.spaceId;
    if (spaceId == null) {
      return `com.mutualzz.app:///me/${channelId}`;
    }
    return `com.mutualzz.app://spaces/channel/${channelId}`;
  }

  private async activateVoicePresenceUi() {
    const props = await this.getVoicePresenceProps();

    await startOrUpdateVoiceLiveActivity(props, this.getVoiceDeepLinkUrl());

    try {
      await startAndroidVoiceForegroundService(props);
    } catch (error) {
      this.logger.warn("startAndroidVoiceForegroundService failed", error);
    }
  }

  private syncGeneration = 0;

  private async syncVoicePresenceUi() {
    if (this.connectionStatus !== "connected") return;

    const generation = ++this.syncGeneration;
    const props = await this.getVoicePresenceProps();
    if (generation !== this.syncGeneration) return;

    await updateVoiceLiveActivity(props);

    try {
      await startAndroidVoiceForegroundService(props);
    } catch (error) {
      this.logger.warn("updateAndroidVoiceForegroundService failed", error);
    }
  }

  private async teardownVoicePresenceUi() {
    await endVoiceLiveActivity();

    try {
      await stopAndroidVoiceForegroundService();
    } catch (error) {
      this.logger.warn("stopAndroidVoiceForegroundService failed", error);
    }

    try {
      await deactivateVoiceAudioSession();
    } catch (error) {
      this.logger.warn("deactivateVoiceAudioSession failed", error);
    }
  }

  private sendVoiceStateUpdate(options?: { refreshRtc?: boolean }) {
    return this.app.gateway.sendVoiceStateUpdate({
      spaceId: this.currentVoiceTarget?.spaceId ?? null,
      channelId: this.currentVoiceTarget?.channelId ?? null,
      selfMute: this.effectiveSelfMute,
      selfDeaf: this.effectiveSelfDeaf,
      client: "mobile",
      refreshRtc: options?.refreshRtc === true,
    });
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      void this.sendVoiceStateUpdate();
    }, 15_000);
  }

  private stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private handleAppStateChange(nextState: AppStateStatus) {
    if (nextState === "background" || nextState === "inactive") {
      this.setPushToTalkPressed(false);
      if (
        this.cameraEnabled &&
        this.connectionStatus === "connected" &&
        !this.cameraSuspendedByBackground
      ) {
        this.cameraSuspendedByBackground = true;
        void this.session.stopCamera();
      }
      return;
    }

    if (nextState !== "active" || !this.cameraSuspendedByBackground) return;

    this.cameraSuspendedByBackground = false;
    if (
      !this.cameraEnabled ||
      this.connectionStatus !== "connected" ||
      !this.abortController
    ) {
      return;
    }

    void this.session
      .startCamera(this.abortController.signal)
      .catch((error) => {
        this.logger.warn("resumeCamera after foreground failed", error);
        runInAction(() => {
          this.cameraEnabled = false;
        });
      });
  }
}
