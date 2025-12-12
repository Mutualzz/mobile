import type { APIUserSettings, AppMode } from "@mutualzz/types";
import { ObservableOrderedSet } from "@utils/ObservableOrderedSet";
import { makeAutoObservable } from "mobx";
import type { AppStore } from "./App.store";

export class AccountSettingsStore {
    currentTheme: string;
    preferredMode: AppMode;
    spacePositions: ObservableOrderedSet<string>;

    constructor(
        private readonly app: AppStore,
        settings: APIUserSettings,
    ) {
        this.currentTheme = settings.currentTheme;
        this.preferredMode = settings.preferredMode;
        this.spacePositions = new ObservableOrderedSet(settings.spacePositions);

        makeAutoObservable(this);
    }

    addPoistion(spaceId: string) {
        this.spacePositions.addFirst(spaceId);
        this.syncSpacePositions();
    }

    reorderSpaces(newOrder: string[]) {
        this.spacePositions.clear();
        newOrder.forEach((id) => this.spacePositions.addLast(id));

        this.syncSpacePositions();
    }

    moveSpace(fromIndex: number, toIndex: number) {
        const items = this.spacePositions.toArray();
        const [removed] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, removed);
        this.reorderSpaces(items);
    }

    async syncSpacePositions() {
        await this.app.rest.patch("@me/settings", {
            spacePositions: this.spacePositions.toArray(),
        });
    }
}
