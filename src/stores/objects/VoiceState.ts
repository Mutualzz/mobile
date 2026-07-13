import type { Snowflake, VoiceState as MzVoiceState } from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { makeAutoObservable } from "mobx";

export class VoiceState {
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
  client?: MzVoiceState["client"];
  disconnectedAt?: number | null;

  constructor(
    private readonly app: AppStore,
    state: MzVoiceState & { disconnectedAt?: number | null }
  ) {
    this.userId = state.userId;
    this.spaceId = state.spaceId ?? null;
    this.channelId = state.channelId ?? null;
    this.selfMute = state.selfMute;
    this.selfDeaf = state.selfDeaf;
    this.spaceMute = state.spaceMute;
    this.spaceDeaf = state.spaceDeaf;
    this.sessionId = state.sessionId;
    this.updatedAt = state.updatedAt;
    this.joinedAt = state.joinedAt ?? state.updatedAt ?? Date.now();
    this.client = state.client;
    this.disconnectedAt = state.disconnectedAt ?? null;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get member() {
    if (!this.space) return null;

    const member = this.space.members.get(this.userId);
    if (!member) return null;
    return member;
  }

  get user() {
    return this.app.users.get(this.userId);
  }

  get space() {
    if (!this.spaceId) return null;
    return this.app.spaces.get(this.spaceId);
  }

  get channel() {
    if (!this.channelId) return null;
    return this.channelId ? this.app.channels.get(this.channelId) : null;
  }
}
