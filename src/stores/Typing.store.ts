import { Snowflake } from "@mutualzz/types";
import { action, makeAutoObservable, observable } from "mobx";
import type { AppStore } from "@stores/App.store";
import { User } from "@stores/objects/User";

interface TypingEntry {
    userId: Snowflake;
    timeoutId: ReturnType<typeof setTimeout>;
}

export class TypingStore {
    typing = observable.map<string, TypingEntry>();

    constructor(private readonly app: AppStore) {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    startedTyping(channelId: Snowflake, userId: Snowflake) {
        if (userId === this.app.account?.id) return;

        const key = `${channelId}:${userId}`;

        if (this.typing.has(key)) {
            clearTimeout(this.typing.get(key)?.timeoutId);
        }

        const timeoutId = setTimeout(
            action(() => this.typing.delete(key)),
            10_000,
        );

        this.typing.set(key, { userId, timeoutId });
    }

    stoppedTyping(channelId: Snowflake, userId: Snowflake) {
        const key = `${channelId}:${userId}`;
        const entry = this.typing.get(key);
        if (entry) {
            clearTimeout(entry.timeoutId);
            this.typing.delete(key);
        }
    }

    getUsersTyping(channelId: string): User[] {
        return Array.from(this.typing.entries())
            .filter(([key]) => key.startsWith(`${channelId}:`))
            .map(([, entry]) => this.app.users.get(entry.userId))
            .filter((x): x is User => !!x);
    }

    areTyping(channelId: string): boolean {
        const prefix = `${channelId}:`;
        for (const key of this.typing.keys()) {
            if (key.startsWith(prefix)) return true;
        }
        return false;
    }

    isUserTyping(channelId: string, userId: string): boolean {
        return this.typing.has(`${channelId}:${userId}`);
    }
}
