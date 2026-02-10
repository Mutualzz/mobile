import type { APIUserSettings, AppMode, Snowflake } from "@mutualzz/types";
import { ObservableOrderedSet } from "@utils/ObservableOrderedSet";
import { makeAutoObservable } from "mobx";
import type { AppStore } from "./App.store";
import { makePersistable } from "mobx-persist-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SettingsPatch = Omit<APIUserSettings, "updatedAt">;

export class AccountSettingsStore {
    currentTheme?: string | null;
    currentIcon?: string | null;
    preferredMode: AppMode;
    preferEmbossed = false;
    spacePositions: ObservableOrderedSet<string>;
    updatedAt: Date;

    private lastSyncedHash: string;
    private syncIntervalId?: ReturnType<typeof setInterval>;

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
        this.preferEmbossed = settings.preferEmbossed;
        this.updatedAt = new Date(settings.updatedAt);

        this.lastSyncedHash = this.computeHash(this.getSyncPayload());

        makeAutoObservable(this);

        makePersistable(this, {
            name: "AccountSettingsStore",
            properties: [
                "currentTheme",
                "currentIcon",
                "preferredMode",
                "preferEmbossed",
                {
                    key: "spacePositions",
                    serialize: (v: unknown) => {
                        if (v instanceof ObservableOrderedSet)
                            return v.toArray();
                        if (Array.isArray(v)) return v.map(String);
                        if (
                            v &&
                            typeof v === "object" &&
                            "toArray" in (v as any)
                        )
                            return (v as any).toArray().map(String);
                        return [];
                    },
                    deserialize: (v: unknown) =>
                        new ObservableOrderedSet<string>(
                            Array.isArray(v) ? v.map(String) : [],
                        ),
                },
                {
                    key: "updatedAt",
                    serialize: (d: unknown) =>
                        d instanceof Date ? d.toISOString() : d,
                    deserialize: (v: unknown) => new Date(v as any),
                },
            ],
            storage: AsyncStorage,
        });
    }

    private getSyncPayload(): SettingsPatch {
        return {
            spacePositions: this.spacePositions.toArray(),
            preferredMode: this.preferredMode,
            preferEmbossed: this.preferEmbossed,
            currentTheme: this.currentTheme,
            currentIcon: this.currentIcon,
        };
    }

    private computeHash(payload: SettingsPatch): string {
        return JSON.stringify(payload);
    }

    private get isDirty(): boolean {
        return this.computeHash(this.getSyncPayload()) !== this.lastSyncedHash;
    }

    setPreferEmbossed(prefer: boolean) {
        this.preferEmbossed = prefer;
    }

    togglePreferEmbossed() {
        this.preferEmbossed = !this.preferEmbossed;
    }

    setCurrentTheme(theme: string | null) {
        this.currentTheme = theme;
    }

    setPreferredMode(mode: AppMode) {
        this.preferredMode = mode;
    }

    setCurrentIcon(icon?: string | null) {
        this.currentIcon = icon;
    }

    update(settings: Partial<APIUserSettings>) {
        if (settings.spacePositions != undefined)
            this.spacePositions.replace(settings.spacePositions.map(String));

        if (settings.currentTheme != undefined)
            this.currentTheme = settings.currentTheme;

        if (settings.currentIcon != undefined)
            this.currentIcon = settings.currentIcon;

        if (settings.preferredMode != undefined)
            this.preferredMode = settings.preferredMode;

        if (settings.updatedAt != undefined)
            this.updatedAt = new Date(settings.updatedAt);

        this.lastSyncedHash = this.computeHash(this.getSyncPayload());
    }

    startSyncing() {
        this.syncIntervalId = setInterval(
            () => {
                this.sync();
            },
            10 * 60 * 1000,
        ); // Sync every 10 minutes, send only if there are changes
    }

    stopSyncing() {
        clearInterval(this.syncIntervalId);
    }

    addPosition(spaceId: Snowflake) {
        this.spacePositions.addFirst(spaceId);
    }

    removePosition(spaceId: Snowflake) {
        this.spacePositions.delete(spaceId);
    }

    reorderSpaces(newOrder: Snowflake[]) {
        this.spacePositions.clear();
        newOrder.forEach((id) => this.spacePositions.addLast(id));
    }

    moveSpace(fromIndex: number, toIndex: number) {
        const items = this.spacePositions.toArray();
        const [removed] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, removed);
        this.reorderSpaces(items);
    }

    async sync() {
        if (!this.app.account) return;
        if (!this.isDirty) return;

        const payload = this.getSyncPayload();

        const res = await this.app.rest
            .patch<APIUserSettings, SettingsPatch>("/@me/settings", payload)
            .catch(() => null);

        if (res) this.update(res);
    }
}
