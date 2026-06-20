import { type APIReadState, ReadStateType, type Snowflake } from "@mutualzz/types";
import { ReadState } from "@stores/objects/ReadState";
import { makeAutoObservable, observable } from "mobx";
import type { AppStore } from "./App.store";

interface AckPayload {
    channelId: Snowflake;
    lastMessageId: Snowflake;
    type: ReadStateType;
}

export class ReadStateStore {
    private states = observable.map<Snowflake, ReadState>();

    constructor(private readonly app: AppStore) {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    addAll(states: APIReadState[]) {
        for (const state of states) {
            const existing = this.states.get(state.id);
            if (existing) existing.update(state);
            else this.states.set(state.id, new ReadState(this.app, state));
        }
    }

    get(channelId: string): ReadState | undefined {
        return this.states.get(channelId);
    }

    updateLocal(channelId: Snowflake, lastMessageId: Snowflake) {
        const existing = this.states.get(channelId);
        if (existing) {
            existing.update({ lastMessageId, mentionCount: 0 });
        } else {
            this.states.set(
                channelId,
                new ReadState(this.app, {
                    id: channelId,
                    lastMessageId,
                    lastAckedId: null,
                    notificationsCursor: null,
                    mentionCount: 0,
                    badgeCount: 0,
                    lastPinTimestamp: null,
                    flags: 0n,
                    type: ReadStateType.Messages,
                }),
            );
        }
    }

    ack(channelId: Snowflake, lastMessageId: Snowflake) {
        this.updateLocal(channelId, lastMessageId);

        return this.app.rest.post(
            `/channels/${channelId}/messages/${lastMessageId}/ack`,
        );
    }

    ackBulk(payload: AckPayload[]) {
        return this.app.rest.post("/channels/ack-bulk", {
            readStates: payload,
        });
    }

    clear() {
        this.states.clear();
    }
}
