import { makePersistable } from "mobx-persist-store";
import { type IObservableArray, makeAutoObservable, observable } from "mobx";
import type { AppStore } from "./App.store";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Entry {
    href: string;
    timestamp: number;
}

type Navigate = (opts: { to: string; replace?: boolean }) => void;

export class NavigationStore {
    entries: IObservableArray<Entry> = observable.array([]);
    index = -1;
    readonly max = 15;

    constructor(private readonly app: AppStore) {
        makeAutoObservable(this, {}, { autoBind: true });

        makePersistable(this, {
            name: "NavigationStore",
            properties: ["entries", "index"],
            storage: AsyncStorage,
        });
    }

    record(href: string) {
        if (!this.app.account) return;
        if (this.current?.href === href) return;

        this.entries.push({ href, timestamp: Date.now() });
        this.index = this.entries.length - 1;

        if (this.entries.length > this.max) {
            const overflow = this.entries.length - this.max;
            this.entries.splice(0, overflow);
            this.index = Math.max(0, this.index - overflow);
        }
    }

    get current() {
        if (!this.app.account) return null;
        return this.entries[this.index] || null;
    }

    get canBack() {
        if (!this.app.account) return false;
        return this.index > 0;
    }

    get canForward() {
        if (!this.app.account) return false;
        return this.index < this.entries.length - 1;
    }

    back(navigate: Navigate) {
        if (!this.app.account) return;
        if (!this.canBack) return;
        this.index -= 1;
        navigate({ to: this.entries[this.index].href });
    }

    forward(navigate: Navigate) {
        if (!this.app.account) return;
        if (!this.canForward) return;
        this.index += 1;
        navigate({ to: this.entries[this.index].href });
    }
}
