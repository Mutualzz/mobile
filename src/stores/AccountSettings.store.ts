import type {
  APIUserSettings,
  AppMode,
  Snowflake,
  UserExtendedSettings,
} from "@mutualzz/types";
import {
  applyExtendedSettingsInPlace,
  mergeExtendedSettings,
} from "@mutualzz/types";
import {
  AccountSettingsSyncEngine,
  buildAccountSettingsPatch,
  isFavoriteEmoji,
  isFavoriteGif,
  mergeRemoteExtendedSettings,
  moveSpaceOrder,
  ObservableOrderedSet,
  resetSpaceOrder as buildDefaultSpaceOrder,
  toggleFavoriteEmoji,
  toggleFavoriteGif,
  type AccountSettingsPatch,
} from "@mutualzz/client";
import { comparer, makeAutoObservable, observable, reaction } from "mobx";
import { AppState, type AppStateStatus, Alert } from "react-native";
import i18n from "../i18n";
import type { AppStore } from "./App.store";

const SYNC_DEBOUNCE_MS = 2_000;

export class AccountSettingsStore {
  currentTheme?: string | null = "baseDark";
  currentIcon?: string | null;
  preferredMode: AppMode;
  preferEmbossed: boolean;
  preferredSelfMute = false;
  preferredSelfDeaf = false;
  pushEnabled = true;
  pushDirectMessages = true;
  pushMentions = true;
  shareActivity = true;
  shareRecentActivity = true;
  spacePositions: ObservableOrderedSet<string>;
  favoriteEmojis = observable.array<string>([]);
  favoriteGifs = observable.array<string>([]);
  favoriteStickers = observable.array<string>([]);
  extendedSettings: UserExtendedSettings;
  updatedAt: Date;

  private syncEngine: AccountSettingsSyncEngine;
  private syncIntervalId?: ReturnType<typeof setInterval>;
  private debounceTimerId?: ReturnType<typeof setTimeout>;
  private disposeReaction: () => void;
  private appStateSubscription: { remove: () => void };

  constructor(
    private readonly app: AppStore,
    settings: APIUserSettings,
  ) {
    this.preferEmbossed = settings.preferEmbossed ?? true;
    this.currentTheme = settings.currentTheme ?? "baseDark";
    this.currentIcon = settings.currentIcon;
    this.preferredMode = settings.preferredMode;
    this.spacePositions = new ObservableOrderedSet(
      settings.spacePositions.map(String),
    );
    this.preferredSelfMute = settings.preferredSelfMute ?? false;
    this.preferredSelfDeaf = settings.preferredSelfDeaf ?? false;
    this.pushEnabled = settings.pushEnabled ?? true;
    this.pushDirectMessages = settings.pushDirectMessages ?? true;
    this.pushMentions = settings.pushMentions ?? true;
    this.shareActivity = settings.shareActivity ?? true;
    this.shareRecentActivity = settings.shareRecentActivity ?? true;
    this.favoriteEmojis = observable.array(settings.favoriteEmojis ?? []);
    this.favoriteGifs = observable.array(settings.favoriteGifs ?? []);
    this.favoriteStickers = observable.array(settings.favoriteStickers ?? []);
    this.extendedSettings = observable.object(
      mergeExtendedSettings(settings.extendedSettings),
    );
    this.updatedAt = new Date(settings.updatedAt);

    this.syncEngine = new AccountSettingsSyncEngine(
      buildAccountSettingsPatch(this),
    );

    this.disposeReaction = reaction(
      () => this.getSyncPayload(),
      () => this.scheduleSync(),
      { equals: comparer.structural },
    );

    makeAutoObservable(this, {}, { autoBind: true });

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
    this.disposeReaction();
    this.appStateSubscription.remove();
  }

  private get isDirty(): boolean {
    return this.syncEngine.isDirty(this.getSyncPayload());
  }

  setPreferEmbossed(prefer: boolean) {
    this.preferEmbossed = prefer;
  }

  togglePreferEmbossed() {
    this.preferEmbossed = !this.preferEmbossed;
  }

  toggleFavoriteGif(entry: string) {
    this.favoriteGifs.replace(toggleFavoriteGif(this.favoriteGifs, entry));
  }

  isFavoriteGif(url: string) {
    return isFavoriteGif(this.favoriteGifs, url);
  }

  setCurrentTheme(theme: string | null) {
    this.currentTheme = theme;
    this.flush();
  }

  setPreferredMode(mode: AppMode) {
    this.preferredMode = mode;
  }

  patchExtendedSettings(
    patch: Partial<UserExtendedSettings>,
    options?: { sync?: "debounced" | "immediate" },
  ) {
    applyExtendedSettingsInPlace(this.extendedSettings, patch);
    if (patch.replyWithMention != undefined) {
      this.app.replyMention = patch.replyWithMention;
    }
    if (patch.defaultMemberListVisible != undefined) {
      this.app.memberListVisible = patch.defaultMemberListVisible;
    }
    if (options?.sync === "immediate") {
      this.flush();
    }
  }

  get extended() {
    return this.extendedSettings;
  }

  setCurrentIcon(icon?: string | null) {
    this.currentIcon = icon;
    this.flush();
  }

  setPreferredSelfMute(value: boolean) {
    this.preferredSelfMute = value;
  }

  setPreferredSelfDeaf(value: boolean) {
    this.preferredSelfDeaf = value;
  }

  setPushEnabled(value: boolean) {
    this.pushEnabled = value;
  }

  setPushDirectMessages(value: boolean) {
    this.pushDirectMessages = value;
  }

  setPushMentions(value: boolean) {
    this.pushMentions = value;
  }

  setShareActivity(value: boolean) {
    const changed = this.shareActivity !== value;
    this.shareActivity = value;
    if (changed) {
      this.app.gateway?.refreshPresenceActivities?.();
    }
  }

  setShareRecentActivity(value: boolean) {
    this.shareRecentActivity = value;
  }

  toggleFavoriteEmoji(unified: string, skinTone: string | null = null) {
    this.favoriteEmojis.replace(
      toggleFavoriteEmoji(this.favoriteEmojis, unified, skinTone),
    );
  }

  isFavoriteEmoji(unified: string, skinTone: string | null = null) {
    return isFavoriteEmoji(this.favoriteEmojis, unified, skinTone);
  }

  toggleFavoriteSticker(id: string) {
    const idx = this.favoriteStickers.indexOf(id);
    if (idx === -1) {
      this.favoriteStickers.push(id);
    } else {
      this.favoriteStickers.splice(idx, 1);
    }
  }

  isFavoriteSticker(id: string) {
    return this.favoriteStickers.includes(id);
  }

  getPendingOverrides(): AccountSettingsPatch | null {
    return this.isDirty ? this.getSyncPayload() : null;
  }

  applyLocalOverrides(payload: AccountSettingsPatch) {
    this.spacePositions.replace(payload.spacePositions.map(String));
    this.currentTheme = payload.currentTheme;
    this.currentIcon = payload.currentIcon;
    this.preferredMode = payload.preferredMode;
    this.preferEmbossed = payload.preferEmbossed;
    this.preferredSelfMute = payload.preferredSelfMute ?? false;
    this.preferredSelfDeaf = payload.preferredSelfDeaf ?? false;
    this.pushEnabled = payload.pushEnabled ?? true;
    this.pushDirectMessages = payload.pushDirectMessages ?? true;
    this.pushMentions = payload.pushMentions ?? true;
    this.shareActivity = payload.shareActivity ?? true;
    this.shareRecentActivity = payload.shareRecentActivity ?? true;
    this.favoriteEmojis = observable.array(payload.favoriteEmojis ?? []);
    this.favoriteGifs = observable.array(payload.favoriteGifs ?? []);
    this.favoriteStickers = observable.array(payload.favoriteStickers ?? []);
    applyExtendedSettingsInPlace(
      this.extendedSettings,
      payload.extendedSettings ?? {},
    );
  }

  private mergeRemoteExtendedSettings(remote: Partial<UserExtendedSettings>) {
    const patch = mergeRemoteExtendedSettings(
      this.extendedSettings,
      this.syncEngine.syncedSnapshot.extendedSettings,
      remote,
    );
    if (!patch) return;

    applyExtendedSettingsInPlace(this.extendedSettings, patch);
    this.applyExtendedSettingsSideEffects(patch, this.extendedSettings);
  }

  private applyExtendedSettingsSideEffects(
    patch: Partial<UserExtendedSettings>,
    merged: UserExtendedSettings,
  ) {
    if (patch.replyWithMention != undefined) {
      this.app.replyMention = merged.replyWithMention;
    }
    if (patch.defaultMemberListVisible != undefined) {
      this.app.memberListVisible = merged.defaultMemberListVisible;
    }
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

    if (settings.preferEmbossed != undefined)
      this.preferEmbossed = settings.preferEmbossed;

    if (settings.favoriteEmojis != undefined)
      this.favoriteEmojis = observable.array(settings.favoriteEmojis);

    if (settings.favoriteGifs != undefined)
      this.favoriteGifs = observable.array(settings.favoriteGifs);

    if (settings.favoriteStickers != undefined)
      this.favoriteStickers = observable.array(settings.favoriteStickers);

    if (settings.preferredSelfMute != undefined)
      this.preferredSelfMute = settings.preferredSelfMute;

    if (settings.preferredSelfDeaf != undefined)
      this.preferredSelfDeaf = settings.preferredSelfDeaf;

    if (settings.pushEnabled != undefined)
      this.pushEnabled = settings.pushEnabled;

    if (settings.pushDirectMessages != undefined)
      this.pushDirectMessages = settings.pushDirectMessages;

    if (settings.pushMentions != undefined)
      this.pushMentions = settings.pushMentions;

    if (settings.shareActivity != undefined) {
      const changed = this.shareActivity !== settings.shareActivity;
      this.shareActivity = settings.shareActivity;
      if (changed) this.app.gateway?.refreshPresenceActivities?.();
    }

    if (settings.shareRecentActivity != undefined)
      this.shareRecentActivity = settings.shareRecentActivity;

    if (settings.extendedSettings != undefined) {
      if (this.isDirty) {
        this.mergeRemoteExtendedSettings(settings.extendedSettings);
      } else {
        applyExtendedSettingsInPlace(
          this.extendedSettings,
          settings.extendedSettings,
        );
        this.applyExtendedSettingsSideEffects(
          settings.extendedSettings,
          this.extendedSettings,
        );
      }
    }

    if (settings.updatedAt != undefined)
      this.updatedAt = new Date(settings.updatedAt);

    this.syncEngine.markSynced(this.getSyncPayload());
  }

  startSyncing() {
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

  resetSpaceOrder() {
    this.reorderSpaces(
      buildDefaultSpaceOrder(this.app.spaces.all.map((space) => space.id)),
    );
    this.flush();
  }

  moveSpace(fromIndex: number, toIndex: number) {
    const items = this.app.spaces.positioned.map((s) => s.id);
    const next = moveSpaceOrder(items, fromIndex, toIndex);
    if (!next) return;
    this.reorderSpaces(next);
  }

  async sync() {
    await this.syncEngine.sync(
      {
        getPayload: () => this.getSyncPayload(),
        applyServerUpdate: (res) => this.update(res),
        applyLocalOverrides: (payload) => this.applyLocalOverrides(payload),
        onSyncFailed: () => Alert.alert(i18n.t("settings:syncFailed")),
      },
      { account: this.app.account, rest: this.app.rest },
    );
  }

  private getSyncPayload(): AccountSettingsPatch {
    return buildAccountSettingsPatch(this);
  }
}
