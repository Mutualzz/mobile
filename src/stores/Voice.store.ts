import { makeAutoObservable } from "mobx";
import type { Snowflake } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { VoiceState } from "@stores/objects/VoiceState";

export type VoiceConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "failed";

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

export class VoiceStore {
  connectionStatus: VoiceConnectionStatus = "idle";
  activeChannelId: Snowflake | null = null;

  constructor(private readonly app: AppStore) {
    makeAutoObservable(this);
  }

  get isConnected() {
    return this.connectionStatus === "connected";
  }

  async joinChannel(channelId: Snowflake) {
    this.connectionStatus = "connecting";
    this.activeChannelId = channelId;
    // react-native-webrtc + mediasoup transport hooks in here next.
    this.connectionStatus = "connected";
  }

  async leaveChannel() {
    this.connectionStatus = "idle";
    this.activeChannelId = null;
  }

  onGatewayReconnected() {
    if (this.activeChannelId) {
      this.connectionStatus = "idle";
    }
  }

  onVoiceStateSync(payload: VoiceStateSyncPayload) {
    for (const state of payload.states) {
      this.app.voiceStates.upsert(state);
    }

    const synced = new Set(payload.states.map((s) => s.userId));
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

    const channelId =
      raw.channelId === "null" || raw.channelId == null ? null : raw.channelId;

    if (!channelId) {
      this.app.voiceStates.remove(raw.userId);
      return;
    }

    this.app.voiceStates.upsert({
      ...raw,
      channelId,
    });
  }
}
