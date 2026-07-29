import type { AppStore } from "@stores/App.store";
import {
  createDefaultSoundToggles,
  SOUND_TO_TOGGLE,
  TOGGLE_PREVIEW_SOUND,
  type AppSound,
  type SoundToggleId,
} from "@stores/soundToggles";
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import callConnectSound from "../../assets/sounds/call_connect.wav";
import callDeclineSound from "../../assets/sounds/call_decline.wav";
import callDisconnectSound from "../../assets/sounds/call_disconnect.wav";
import callIncomingSound from "../../assets/sounds/call_incoming.wav";
import callOutgoingSound from "../../assets/sounds/call_outgoing.wav";
import deafenOffSound from "../../assets/sounds/deafen_off.wav";
import deafenOnSound from "../../assets/sounds/deafen_on.wav";
import messageSound from "../../assets/sounds/message.wav";
import muteOffSound from "../../assets/sounds/mute_off.wav";
import muteOnSound from "../../assets/sounds/mute_on.wav";
import pttStartSound from "../../assets/sounds/ptt_start.wav";
import pttStopSound from "../../assets/sounds/ptt_stop.wav";
import streamStartSound from "../../assets/sounds/stream_start.wav";
import streamStopSound from "../../assets/sounds/stream_stop.wav";
import userJoinSound from "../../assets/sounds/user_join.wav";
import userLeaveSound from "../../assets/sounds/user_leave.wav";
import { makeAutoObservable, observable, reaction } from "mobx";
import { makePersistable } from "mobx-persist-store";

export type { AppSound, SoundToggleId } from "@stores/soundToggles";
export { SOUND_TOGGLE_IDS } from "@stores/soundToggles";

const SOURCES: Record<AppSound, number> = {
  message: messageSound,
  user_join: userJoinSound,
  user_leave: userLeaveSound,
  call_connect: callConnectSound,
  call_disconnect: callDisconnectSound,
  call_incoming: callIncomingSound,
  call_outgoing: callOutgoingSound,
  call_decline: callDeclineSound,
  mute_on: muteOnSound,
  mute_off: muteOffSound,
  deafen_on: deafenOnSound,
  deafen_off: deafenOffSound,
  ptt_start: pttStartSound,
  ptt_stop: pttStopSound,
  stream_start: streamStartSound,
  stream_stop: streamStopSound,
};

const DEFAULT_VOLUME = 0.45;

export class SoundStore {
  enabled = true;
  toggles = observable.object(createDefaultSoundToggles());

  readonly loopPlayers = new Map<
    "call_incoming" | "call_outgoing",
    AudioPlayer
  >();
  private looping: "call_incoming" | "call_outgoing" | null = null;
  private loopGeneration = 0;
  private oneShotGeneration = 0;
  readonly activeOneShots = new Set<AudioPlayer>();
  private modeReady = false;
  readonly disposers: (() => void)[] = [];

  constructor(private readonly app: AppStore) {
    makeAutoObservable(
      this,
      {
        loopPlayers: false,
        activeOneShots: false,
        disposers: false,
      },
      { autoBind: true },
    );

    for (const id of ["call_incoming", "call_outgoing"] as const) {
      const player = createAudioPlayer(SOURCES[id]);
      player.volume = DEFAULT_VOLUME;
      player.loop = true;
      this.loopPlayers.set(id, player);
    }

    void makePersistable(this, {
      name: "SoundStore",
      properties: ["enabled", "toggles"],
      storage: AsyncStorage,
    });

    void this.ensureAudioMode();

    this.disposers.push(
      reaction(
        () => ({
          incoming: this.app.calls.getIncomingRingingChannelId(),
          outgoing: this.app.calls.getOutgoingRingingChannelId(),
        }),
        ({ incoming, outgoing }) => {
          if (incoming) {
            this.playLoop("call_incoming");
            return;
          }
          if (outgoing) {
            this.playLoop("call_outgoing");
            return;
          }
          this.stopLoop();
        },
        { fireImmediately: true },
      ),
    );

    this.disposers.push(
      reaction(
        () => this.app.voice.connectionStatus,
        (status, previous) => {
          if (status === "connected" && previous !== "connected") {
            const stillRinging =
              !!this.app.calls.getIncomingRingingChannelId() ||
              !!this.app.calls.getOutgoingRingingChannelId();
            if (!stillRinging) {
              this.play("call_connect");
            }
          }
        },
      ),
    );

    this.disposers.push(
      reaction(
        () => this.enabled,
        (enabled) => {
          if (!enabled) this.stopAll();
        },
      ),
    );
  }

  isToggleEnabled(id: SoundToggleId) {
    return this.toggles[id];
  }

  private canPlay(id: AppSound) {
    if (!this.enabled) return false;
    if (!this.isToggleEnabled(SOUND_TO_TOGGLE[id])) return false;
    if (id === "message" && this.isSelfDnd()) return false;
    return true;
  }

  private isSelfDnd() {
    const selfId = this.app.account?.id;
    if (!selfId) return false;
    const status = this.app.presence.get(String(selfId))?.status ?? "online";
    return status === "dnd";
  }

  setEnabled(value: boolean) {
    this.enabled = value;
    if (!value) this.stopAll();
  }

  setToggle(id: SoundToggleId, value: boolean) {
    this.toggles[id] = value;
    if (
      !value &&
      ((id === "call_incoming" && this.looping === "call_incoming") ||
        (id === "call_outgoing" && this.looping === "call_outgoing"))
    ) {
      this.stopLoop();
    }
  }

  private async ensureAudioMode() {
    if (this.modeReady) return;
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: "mixWithOthers",
        shouldPlayInBackground: false,
      });
      this.modeReady = true;
    } catch {
      // ignore mode setup failures
    }
  }

  unlock() {
    void this.ensureAudioMode().then(() => {
      this.retryRingIfNeeded();
    });
  }

  private retryRingIfNeeded() {
    const incoming = this.app.calls.getIncomingRingingChannelId();
    const outgoing = this.app.calls.getOutgoingRingingChannelId();
    if (incoming) {
      this.playLoop("call_incoming");
      return;
    }
    if (outgoing) {
      this.playLoop("call_outgoing");
    }
  }

  play(id: AppSound) {
    if (!this.canPlay(id)) return;
    if (id === "call_incoming" || id === "call_outgoing") {
      this.playLoop(id);
      return;
    }
    this.playOnce(id);
  }

  preview(toggleId: SoundToggleId) {
    this.playOnce(TOGGLE_PREVIEW_SOUND[toggleId]);
  }

  private playOnce(id: AppSound) {
    const source = SOURCES[id];
    if (source == null) return;

    void this.ensureAudioMode();
    const generation = ++this.oneShotGeneration;
    const player = createAudioPlayer(source);
    player.volume = DEFAULT_VOLUME;
    player.loop = false;
    this.activeOneShots.add(player);

    const cleanup = () => {
      if (!this.activeOneShots.has(player)) return;
      this.activeOneShots.delete(player);
      try {
        player.pause();
        player.remove();
      } catch {
        // ignore
      }
    };

    void player.seekTo(0).then(() => {
      if (generation !== this.oneShotGeneration) {
        cleanup();
        return;
      }
      try {
        player.play();
      } catch {
        cleanup();
      }
    });

    setTimeout(cleanup, 5000);
  }

  playLoop(id: "call_incoming" | "call_outgoing") {
    if (!this.canPlay(id)) {
      this.stopLoop();
      return;
    }

    const player = this.loopPlayers.get(id);
    if (!player) return;

    if (this.looping === id && player.playing) return;

    this.stopLoop();
    void this.ensureAudioMode();

    const generation = ++this.loopGeneration;
    this.looping = id;
    player.loop = true;
    void player.seekTo(0).then(() => {
      if (this.loopGeneration !== generation || this.looping !== id) return;
      player.play();
    });
  }

  stopLoop() {
    this.loopGeneration += 1;
    this.looping = null;
    for (const player of this.loopPlayers.values()) {
      player.loop = false;
      player.pause();
      void player.seekTo(0);
    }
  }

  private stopOneShots() {
    this.oneShotGeneration += 1;
    for (const player of Array.from(this.activeOneShots)) {
      this.activeOneShots.delete(player);
      try {
        player.pause();
        player.remove();
      } catch {
        // ignore
      }
    }
  }

  stopAll() {
    this.stopLoop();
    this.stopOneShots();
  }

  dispose() {
    this.stopAll();
    for (const dispose of this.disposers) dispose();
    this.disposers.length = 0;
    for (const player of this.loopPlayers.values()) {
      try {
        player.pause();
        player.remove();
      } catch {
        // ignore
      }
    }
    this.loopPlayers.clear();
  }
}
