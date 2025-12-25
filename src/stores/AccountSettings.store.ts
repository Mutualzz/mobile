import type { APIUserSettings, AppMode, Snowflake } from "@mutualzz/types";
import { ObservableOrderedSet } from "@utils/ObservableOrderedSet";
import { makeAutoObservable } from "mobx";
import type { AppStore } from "./App.store";

export class AccountSettingsStore {
    currentTheme?: string | null;
    currentIcon?: string | null;
    preferredMode: AppMode;
    spacePositions: ObservableOrderedSet<string>;
    updatedAt: Date;

    constructor(
        private readonly app: AppStore,
        settings: APIUserSettings,
    ) {
        this.currentTheme = settings.currentTheme;
        this.currentIcon = settings.currentIcon;
        this.preferredMode = settings.preferredMode;
        this.spacePositions = new ObservableOrderedSet(
            settings.spacePositions.map(String),
        );
        this.updatedAt = new Date(settings.updatedAt);

        makeAutoObservable(this);
    }

    setCurrentTheme(theme: string | null) {
        this.currentTheme = theme;
        this.sync();
    }

    setPreferredMode(mode: AppMode) {
        this.preferredMode = mode;
        this.sync();
    }

    setCurrentIcon(icon?: string | null) {
        this.currentIcon = icon;
        this.sync();
    }

    update(settings: Partial<APIUserSettings>) {
        if (settings.spacePositions) {
            this.spacePositions.replace(settings.spacePositions.map(String));
        }
        if (settings.currentTheme !== undefined) {
            this.currentTheme = settings.currentTheme;
        }
        if (settings.currentIcon !== undefined) {
            this.currentIcon = settings.currentIcon;
        }
        if (settings.preferredMode !== undefined) {
            this.preferredMode = settings.preferredMode;
        }
        if (settings.updatedAt) {
            this.updatedAt = new Date(settings.updatedAt);
        }
    }

    addPosition(spaceId: Snowflake) {
        this.spacePositions.addFirst(spaceId);
        this.sync();
    }

    removePosition(spaceId: Snowflake) {
        this.spacePositions.delete(spaceId);
        this.sync();
    }

    reorderSpaces(newOrder: Snowflake[]) {
        this.spacePositions.clear();
        newOrder.forEach((id) => this.spacePositions.addLast(id));
        this.sync();
    }

    moveSpace(fromIndex: number, toIndex: number) {
        const items = this.spacePositions.toArray();
        const [removed] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, removed);
        this.reorderSpaces(items);
    }

    async sync() {
        await this.app.rest.patch<
            APIUserSettings,
            Omit<APIUserSettings, "updatedAt">
        >("/@me/settings", {
            spacePositions: this.spacePositions.toArray(),
            preferredMode: this.preferredMode,
            currentTheme: this.currentTheme,
            currentIcon: this.currentIcon,
        });
    }
}
