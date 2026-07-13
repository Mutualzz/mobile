import { Logger } from "@mutualzz/logger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable, observable, runInAction } from "mobx";
import { makePersistable } from "mobx-persist-store";
import type { Snowflake, VoiceState as ApiVoiceState } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
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
import { ensureVoiceMicPermission } from "@utils/voicePermissions";
import { AppState, type AppStateStatus } from "react-native";
import type { MediaStream } from "react-native-webrtc";
import { mediaDevices } from "react-native-webrtc";
import i18n from "../i18n";

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
  private readonly session: MediasoupSession;
  private readonly logger = new Logger({ tag: "VoiceStore" });
  private abortController: AbortController | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private joinTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private cameraProducerByUser = new Map<string, string>();
  private cameraSuspendedByBackground = false;
  private readonly appStateSubscription = AppState.addEventListener(
    "change",
    (nextState) => this.handleAppStateChange(nextState),
  );

  constructor(private readonly app: AppStore) {
    this.session = new MediasoupSession({
      callbacks: {
        onSocketClosed: (reason) => {
          const reasonLower = String(reason ?? "").toLowerCase();
          const isSuperseded =
            reasonLower.includes("superseded") ||
            reasonLower.includes("minecraft") ||
            reasonLower.includes("different device");
          const canAutoRejoin =
            !isSuperseded &&
            this.connectionStatus === "connected" &&
            !!this.currentVoiceTarget &&
            this.app.isGatewayReady;
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
      shouldReportSpeaking: (userId) => this.shouldReportSpeakingForUser(userId),
      getNoiseSuppression: () => this.noiseSuppression,
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
      this.logger.warn("restartMic after noise suppression toggle failed", error);
    } finally {
      runInAction(() => {
        this.noiseSuppressionPending = false;
      });
    }
  }

  setPushToTalkPressed(pressed: boolean) {
    if (this.voiceInputMode !== "push_to_talk") return;
    if (this.pushToTalkActive === pressed) return;
    this.pushToTalkActive = pressed;
    if (!this.isRtcConnected) return;

    try {
      this.session.setPushToTalkPressed(pressed);
    } catch (error) {
      this.logger.warn("Failed to apply push-to-talk state", error);
    }
  }

  get isPushToTalkMode() {
    return this.voiceInputMode === "push_to_talk";
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
      this.session.setInputMode(this.voiceInputMode);
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
    if (this.voiceInputMode === "push_to_talk") {
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
        const hasLabels = initialDevices.some((device) => device.label.length > 0);

        if (!hasLabels) {
          try {
            const tmp = await mediaDevices.getUserMedia({
              audio: true,
              video: true,
            });
            tmp.getTracks().forEach((track) => {
              try {
                track.stop();
              } catch {}
            });
          } catch {
            try {
              const tmp = await mediaDevices.getUserMedia({
                audio: true,
                video: false,
              });
              tmp.getTracks().forEach((track) => {
                try {
                  track.stop();
                } catch {}
              });
            } catch {}
          }
        }
      }

      const devices = parseMediaDeviceList(
        await mediaDevices.enumerateDevices(),
      );
      const audioInputs = devices.filter((device) => device.kind === "audioinput");
      const videoInputs = devices.filter((device) => device.kind === "videoinput");

      runInAction(() => {
        this.inputs.replace(audioInputs);
        this.cameras.replace(videoInputs);
        this.currentInputDeviceId =
          this.currentInputDeviceId &&
          audioInputs.some((device) => device.deviceId === this.currentInputDeviceId)
            ? this.currentInputDeviceId
            : (audioInputs[0]?.deviceId ?? null);
        this.currentCameraDeviceId =
          this.currentCameraDeviceId &&
          videoInputs.some((device) => device.deviceId === this.currentCameraDeviceId)
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

    await this.setupDevices(true);

    const hasMicPermission = await ensureVoiceMicPermission();
    if (!hasMicPermission) {
      runInAction(() => {
        this.connectionError = i18n.t("voice.errors.micPermissionRequired", {
          ns: "chat",
        });
        this.connectionStatus = "failed";
        this.currentVoiceTarget = null;
      });
      return;
    }

    const preferredSelfMute = this.app.settings?.preferredSelfMute ?? false;
    const preferredSelfDeaf = this.app.settings?.preferredSelfDeaf ?? false;

    runInAction(() => {
      this.currentVoiceTarget = {
        spaceId: target.spaceId ?? null,
        channelId: target.channelId,
      };
      this.connectionStatus = "connecting";
      this.connectionError = null;
      this.selfMute = preferredSelfMute;
      this.selfDeaf = preferredSelfDeaf;
    });

    this.startJoinTimeout();
    await this.sendVoiceStateUpdate();
    this.startKeepAlive();
  }

  async joinChannel(channelId: Snowflake, spaceId?: Snowflake | null) {
    await this.join({ channelId, spaceId: spaceId ?? null });
  }

  async leave() {
    this.clearJoinTimeout();
    this.abortAndTeardown();
    this.stopKeepAlive();
    this.cameraSuspendedByBackground = false;

    runInAction(() => {
      this.connectionStatus = "idle";
      this.connectionError = null;
      this.currentVoiceTarget = null;
      this.currentSessionId = null;
      this.pendingEndpoint = null;
      this.pendingToken = null;
      this.cameraEnabled = false;
      this.spaceMute = false;
      this.spaceDeaf = false;
      this.remoteCameraStreams.clear();
      this.speakingUsers.clear();
      this.pushToTalkActive = false;
    });
    this.cameraProducerByUser.clear();

    await this.sendVoiceStateUpdate();
  }

  async leaveChannel() {
    await this.leave();
  }

  clear() {
    this.clearJoinTimeout();
    this.abortAndTeardown();
    this.stopKeepAlive();
    this.connectionStatus = "idle";
    this.connectionError = null;
    this.currentVoiceTarget = null;
    this.currentSessionId = null;
    this.cameraEnabled = false;
    this.remoteCameraStreams.clear();
    this.cameraProducerByUser.clear();
    this.speakingUsers.clear();
  }

  onGatewayReconnected() {
    if (!this.currentVoiceTarget) return;

    const selfId = this.app.account?.id;
    const selfState = selfId ? this.app.voiceStates.get(selfId) : null;
    if (selfState?.client === "minecraft" && selfState.channelId) {
      runInAction(() => {
        this.connectionStatus = "idle";
        this.currentVoiceTarget = null;
      });
      this.stopKeepAlive();
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
    if (!payload.voiceEndpoint?.trim()) {
      this.failJoin(i18n.t("voice.errors.notConfigured", { ns: "chat" }));
      return;
    }

    this.pendingEndpoint = payload.voiceEndpoint;
    this.pendingToken = payload.voiceToken;

    runInAction(() => {
      this.currentVoiceTarget = {
        spaceId: payload.spaceId ?? null,
        channelId: payload.channelId,
      };
      this.currentSessionId = payload.sessionId;
    });

    void this.startConnection();
  }

  onVoiceStateSync(payload: VoiceStateSyncPayload) {
    for (const state of payload.states) {
      this.syncSelfFromState(state);
      this.app.voiceStates.upsert(state);
    }

    const synced = new Set(payload.states.map((state) => state.userId));
    for (const existing of this.app.voiceStates.getAllByChannel(
      payload.channelId,
    )) {
      if (!synced.has(existing.userId)) {
        this.app.voiceStates.remove(existing.userId);
      }
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
          }
        : state;

    this.syncSelfFromState(raw);

    const channelId =
      raw.channelId === "null" || raw.channelId == null ? null : raw.channelId;

    if (
      !channelId &&
      raw.userId === this.app.account?.id &&
      this.connectionStatus === "connecting"
    ) {
      this.failJoin(i18n.t("voice.errors.unableToJoin", { ns: "chat" }));
      return;
    }

    if (!channelId) {
      this.app.voiceStates.remove(raw.userId);
      if (raw.userId !== this.app.account?.id) {
        runInAction(() => {
          this.remoteCameraStreams.delete(raw.userId);
          this.speakingUsers.delete(raw.userId);
        });
        this.cameraProducerByUser.delete(raw.userId);
      }
      return;
    }

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
      return;
    }

    runInAction(() => {
      this.selfMute = value;
    });
    this.app.settings?.setPreferredSelfMute(value);
    this.applySessionVoiceFlags();
    void this.sendVoiceStateUpdate();
  }

  setDeaf(value: boolean) {
    if (this.spaceDeaf) return;

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

    this.startKeepAlive();
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
      this.session.setInputDeviceId(this.currentInputDeviceId);
      this.session.setCameraDeviceId(
        this.cameraEnabled ? this.currentCameraDeviceId : null,
      );
      this.session.setSpaceMute(this.spaceMute);
      this.session.setSelfMute(this.selfMute);
      this.session.setSelfDeaf(this.selfDeaf);
      this.applyVoiceSettings();

      await this.session.connect(fixConnectionUrl(endpoint), token, signal);
      if (signal.aborted) return;

      const hasMicPermission = await ensureVoiceMicPermission();
      if (!hasMicPermission) {
        throw new Error(
          i18n.t("voice.errors.micPermissionRequired", { ns: "chat" }),
        );
      }

      try {
        await this.session.startMic(signal);
      } catch (error) {
        this.logger.warn("startMic after connect failed", error);
      }

      if (signal.aborted) return;

      if (this.cameraEnabled) {
        try {
          await this.session.startCamera(signal);
        } catch (error) {
          this.logger.warn("startCamera after connect failed", error);
          runInAction(() => {
            this.cameraEnabled = false;
          });
        }
      }

      if (signal.aborted) return;

      runInAction(() => {
        this.connectionStatus = "connected";
      });
      this.applySessionVoiceFlags();
      this.clearJoinTimeout();
      this.startKeepAlive();
    } catch (error) {
      if (signal.aborted) return;

      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn("Voice connection failed", {
        message,
        stack: error instanceof Error ? error.stack : undefined,
      });

      runInAction(() => {
        this.connectionStatus = "failed";
        this.connectionError = message;
      });
      this.clearJoinTimeout();
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

  private failJoin(message: string) {
    this.clearJoinTimeout();
    this.abortAndTeardown();
    this.stopKeepAlive();
    this.cameraSuspendedByBackground = false;

    runInAction(() => {
      this.connectionStatus = "failed";
      this.connectionError = message;
      this.currentVoiceTarget = null;
      this.currentSessionId = null;
      this.cameraEnabled = false;
      this.remoteCameraStreams.clear();
      this.speakingUsers.clear();
    });
    this.cameraProducerByUser.clear();
    void this.sendVoiceStateUpdate();
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

    this.spaceMute = raw.spaceMute ?? false;
    this.spaceDeaf = raw.spaceDeaf ?? false;
    this.selfMute = this.spaceMute ? true : raw.selfMute;
    this.selfDeaf = this.spaceDeaf ? true : raw.selfDeaf;

    this.applySessionVoiceFlags();
  }

  private sendVoiceStateUpdate(options?: { refreshRtc?: boolean }) {
    this.app.gateway.sendVoiceStateUpdate({
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
