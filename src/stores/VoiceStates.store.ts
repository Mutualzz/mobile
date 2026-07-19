import type { AppStore } from "@stores/App.store";
import { makeAutoObservable, observable, type ObservableMap } from "mobx";
import type { Snowflake, VoiceState as JSONVoiceState } from "@mutualzz/types";
import { VoiceState } from "@stores/objects/VoiceState";

export class VoiceStatesStore {
    private readonly states: ObservableMap<Snowflake, VoiceState>;

    constructor(private readonly app: AppStore) {
        this.states = observable.map();
        makeAutoObservable(this);
    }

    get all() {
        return Array.from(this.states.values());
    }

    upsert(state: JSONVoiceState & { disconnectedAt?: number | null }) {
        const existing = this.states.get(state.userId);

        if (existing) {
            existing.spaceId = state.spaceId ?? null;
            existing.channelId = state.channelId ?? null;
            existing.selfMute = state.selfMute;
            existing.selfDeaf = state.selfDeaf;
            existing.spaceMute = state.spaceMute;
            existing.spaceDeaf = state.spaceDeaf;
            existing.sessionId = state.sessionId;
            existing.updatedAt = state.updatedAt;
            if (typeof state.joinedAt === "number") {
                existing.joinedAt = state.joinedAt;
            }
            if (state.client != null || state.channelId == null) {
                existing.client = state.client;
            }
            existing.disconnectedAt = state.disconnectedAt ?? null;
            return existing;
        }

        const newVoiceState = new VoiceState(this.app, state);
        this.states.set(state.userId, newVoiceState);
        return newVoiceState;
    }

    set(states: JSONVoiceState[]) {
        for (const state of states) {
            this.upsert(state);
        }
    }

    replace(states: JSONVoiceState[]) {
        const nextIds = new Set<Snowflake>();

        for (const state of states) {
            nextIds.add(state.userId);
            this.upsert(state);
        }

        for (const existingId of this.states.keys()) {
            if (!nextIds.has(existingId)) {
                this.states.delete(existingId);
            }
        }
    }

    remove(userId: Snowflake) {
        this.states.delete(userId);
    }

    clear() {
        this.states.clear();
    }

    get(userId: Snowflake) {
        return this.states.get(userId);
    }

  getAllByChannel(channelId?: Snowflake | null) {
    const target = channelId == null ? null : String(channelId);
    return this.all
      .filter(
        (state) =>
          state.channelId != null &&
          String(state.channelId) === target &&
          !state.disconnectedAt,
      )
      .sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0));
  }
}
