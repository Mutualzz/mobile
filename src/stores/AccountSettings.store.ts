import type { APIUserSettings, AppMode, Snowflake } from "@mutualzz/types";
import { ObservableOrderedSet } from "@utils/ObservableOrderedSet";
import { comparer, makeAutoObservable, observable, reaction } from "mobx";
import type { AppStore } from "./App.store";
import { makePersistable } from "mobx-persist-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus } from "react-native";

type SettingsPatch = Omit<APIUserSettings, "updatedAt">;

const SYNC_DEBOUNCE_MS = 2_000;

export class AccountSettingsStore {
  currentTheme?: string | null = "baseDark";
  currentIcon?: string | null;
  preferredMode: AppMode;
  preferEmbossed = false;
  spacePositions: ObservableOrderedSet<string>;
  favoriteEmojis = observable.array<string>([]);
  favoriteGifs = observable.array<string>([]);
  updatedAt: Date;

  private lastSyncedHash: string;
  private syncIntervalId?: ReturnType<typeof setInterval>;
  private debounceTimerId?: ReturnType<typeof setTimeout>;
  private appStateSubscription: { remove: () => void };

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
    this.favoriteEmojis = observable.array(settings.favoriteEmojis ?? []);
    this.favoriteGifs = observable.array(settings.favoriteGifs ?? []);
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
          key: "favoriteEmojis",
          serialize: (v: unknown) => (Array.isArray(v) ? [...v] : []),
          deserialize: (v: unknown) =>
            observable.array(Array.isArray(v) ? v : []),
        },
        {
          key: "favoriteGifs",
          serialize: (v: unknown) => (Array.isArray(v) ? [...v] : []),
          deserialize: (v: unknown) =>
            observable.array(Array.isArray(v) ? v : []),
        },
        {
          key: "spacePositions",
          serialize: (v: unknown) => {
            if (v instanceof ObservableOrderedSet) return v.toArray();
            if (Array.isArray(v)) return v.map(String);
            if (v && typeof v === "object" && "toArray" in (v as any))
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
          serialize: (d: unknown) => (d instanceof Date ? d.toISOString() : d),
          deserialize: (v: unknown) => new Date(v as any),
        },
      ],
      storage: AsyncStorage,
    });

    reaction(
      () => this.getSyncPayload(),
      () => this.scheduleSync(),
      {
        equals: comparer.structural,
      },
    );

    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => this.handleAppStateChange(nextState),
    );
  }

  private scheduleSync() {
    if (this.debounceTimerId) clearTimeout(this.debounceTimerId);
    this.debounceTimerId = setTimeout(() => this.sync(), SYNC_DEBOUNCE_MS);
  }

  private handleAppStateChange(nextState: AppStateStatus) {
    if (nextState === "background" || nextState === "inactive") this.flush();
  }

  flush() {
    if (this.debounceTimerId) clearTimeout(this.debounceTimerId);
    void this.sync();
  }

  dispose() {
    this.stopSyncing();
    this.appStateSubscription.remove();
  }

  private getSyncPayload(): SettingsPatch {
    return {
      spacePositions: this.spacePositions.toArray(),
      preferredMode: this.preferredMode,
      preferEmbossed: this.preferEmbossed,
      currentTheme: this.currentTheme,
      currentIcon: this.currentIcon,
      preferredSelfMute: false,
      preferredSelfDeaf: false,
      favoriteEmojis: [...this.favoriteEmojis],
      favoriteGifs: [...this.favoriteGifs],
      favoriteStickers: [],
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

  toggleFavoriteGif(entry: string) {
    const url = entry.split("|")[0];
    const idx = this.favoriteGifs.findIndex((f) => f.split("|")[0] === url);
    if (idx === -1) {
      this.favoriteGifs.push(entry);
    } else {
      this.favoriteGifs.splice(idx, 1);
    }
  }

  isFavoriteGif(url: string) {
    const bare = url.split("|")[0];
    return this.favoriteGifs.some((f) => f.split("|")[0] === bare);
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

  getPendingOverrides(): SettingsPatch | null {
    return this.isDirty ? this.getSyncPayload() : null;
  }

  applyLocalOverrides(payload: SettingsPatch) {
    this.spacePositions.replace(payload.spacePositions.map(String));
    this.currentTheme = payload.currentTheme;
    this.currentIcon = payload.currentIcon;
    this.preferredMode = payload.preferredMode;
    this.preferEmbossed = payload.preferEmbossed;
    this.favoriteEmojis = observable.array(payload.favoriteEmojis ?? []);
    this.favoriteGifs = observable.array(payload.favoriteGifs ?? []);
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

    if (settings.favoriteEmojis != undefined)
      this.favoriteEmojis = observable.array(settings.favoriteEmojis);

    if (settings.favoriteGifs != undefined)
      this.favoriteGifs = observable.array(settings.favoriteGifs);

    if (settings.updatedAt != undefined)
      this.updatedAt = new Date(settings.updatedAt);

    this.lastSyncedHash = this.computeHash(this.getSyncPayload());
  }

  startSyncing() {
    // Backstop in case the debounced sync (see the reaction registered in the
    // constructor) got dropped, e.g. a change was made while offline.
    this.syncIntervalId = setInterval(
      () => {
        this.sync();
      },
      10 * 60 * 1000,
    );
  }

  stopSyncing() {
    clearInterval(this.syncIntervalId);
    if (this.debounceTimerId) clearTimeout(this.debounceTimerId);
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
