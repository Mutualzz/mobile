import type { APIUserSettings, Snowflake } from "@mutualzz/types";
import { DEFAULT_CLIENT_PREFERENCES } from "@mutualzz/types";
import {
  AccountSettingsSyncEngine,
  buildAccountSettingsPatch,
  isFavoriteEmoji,
  isFavoriteGif,
  mergeRemoteSettings,
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
  preferEmbossed = true;
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
  whoCanDm: APIUserSettings["whoCanDm"] = "everyone";
  profileVisibility: APIUserSettings["profileVisibility"] = "everyone";
  convertEmoticons = DEFAULT_CLIENT_PREFERENCES.convertEmoticons;
  uiDensity = DEFAULT_CLIENT_PREFERENCES.uiDensity;
  messageDisplay = DEFAULT_CLIENT_PREFERENCES.messageDisplay;
  chatFontScale = DEFAULT_CLIENT_PREFERENCES.chatFontScale;
  timestampFormat = DEFAULT_CLIENT_PREFERENCES.timestampFormat;
  showLinkEmbeds = DEFAULT_CLIENT_PREFERENCES.showLinkEmbeds;
  gifAutoplay = DEFAULT_CLIENT_PREFERENCES.gifAutoplay;
  revealAllSpoilers = DEFAULT_CLIENT_PREFERENCES.revealAllSpoilers;
  showTypingIndicators = DEFAULT_CLIENT_PREFERENCES.showTypingIndicators;
  sendTypingIndicators = DEFAULT_CLIENT_PREFERENCES.sendTypingIndicators;
  replyWithMention = DEFAULT_CLIENT_PREFERENCES.replyWithMention;
  quickReactionEmojis = observable.array<string>(
    DEFAULT_CLIENT_PREFERENCES.quickReactionEmojis,
  );
  showEmojiPicker = DEFAULT_CLIENT_PREFERENCES.showEmojiPicker;
  showGifPicker = DEFAULT_CLIENT_PREFERENCES.showGifPicker;
  showStickerPicker = DEFAULT_CLIENT_PREFERENCES.showStickerPicker;
  showMarkdownToolbar = DEFAULT_CLIENT_PREFERENCES.showMarkdownToolbar;
  reducedMotion = DEFAULT_CLIENT_PREFERENCES.reducedMotion;
  highContrast = DEFAULT_CLIENT_PREFERENCES.highContrast;
  defaultMemberListVisible = DEFAULT_CLIENT_PREFERENCES.defaultMemberListVisible;
  showRoleColorsInMessages = DEFAULT_CLIENT_PREFERENCES.showRoleColorsInMessages;
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
    this.spacePositions = new ObservableOrderedSet(
      settings.spacePositions.map(String),
    );
    this.applySyncedSettings(settings);
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

  private applySyncedSettings(settings: APIUserSettings) {
    this.preferEmbossed = settings.preferEmbossed ?? true;
    this.currentTheme = settings.currentTheme ?? "baseDark";
    this.currentIcon = settings.currentIcon;
    this.preferredSelfMute = settings.preferredSelfMute ?? false;
    this.preferredSelfDeaf = settings.preferredSelfDeaf ?? false;
    this.pushEnabled = settings.pushEnabled ?? true;
    this.pushDirectMessages = settings.pushDirectMessages ?? true;
    this.pushMentions = settings.pushMentions ?? true;
    this.shareActivity = settings.shareActivity ?? true;
    this.shareRecentActivity = settings.shareRecentActivity ?? true;
    this.favoriteEmojis.replace(settings.favoriteEmojis ?? []);
    this.favoriteGifs.replace(settings.favoriteGifs ?? []);
    this.favoriteStickers.replace(settings.favoriteStickers ?? []);
    this.whoCanDm = settings.whoCanDm;
    this.profileVisibility = settings.profileVisibility;
    this.convertEmoticons = settings.convertEmoticons;
    this.uiDensity = settings.uiDensity;
    this.messageDisplay = settings.messageDisplay;
    this.chatFontScale = settings.chatFontScale;
    this.timestampFormat = settings.timestampFormat;
    this.showLinkEmbeds = settings.showLinkEmbeds;
    this.gifAutoplay = settings.gifAutoplay;
    this.revealAllSpoilers = settings.revealAllSpoilers;
    this.showTypingIndicators = settings.showTypingIndicators;
    this.sendTypingIndicators = settings.sendTypingIndicators;
    this.replyWithMention = settings.replyWithMention;
    this.quickReactionEmojis.replace(settings.quickReactionEmojis ?? []);
    this.showEmojiPicker = settings.showEmojiPicker;
    this.showGifPicker = settings.showGifPicker;
    this.showStickerPicker = settings.showStickerPicker;
    this.showMarkdownToolbar = settings.showMarkdownToolbar;
    this.reducedMotion = settings.reducedMotion;
    this.highContrast = settings.highContrast;
    this.defaultMemberListVisible = settings.defaultMemberListVisible;
    this.showRoleColorsInMessages = settings.showRoleColorsInMessages;
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

  patchSettings(
    patch: Partial<AccountSettingsPatch>,
    options?: { sync?: "debounced" | "immediate" },
  ) {
    if (patch.favoriteEmojis != undefined) {
      this.favoriteEmojis.replace(patch.favoriteEmojis);
    }
    if (patch.favoriteGifs != undefined) {
      this.favoriteGifs.replace(patch.favoriteGifs);
    }
    if (patch.favoriteStickers != undefined) {
      this.favoriteStickers.replace(patch.favoriteStickers);
    }
    if (patch.quickReactionEmojis != undefined) {
      this.quickReactionEmojis.replace(patch.quickReactionEmojis);
    }

    const {
      favoriteEmojis: _favoriteEmojis,
      favoriteGifs: _favoriteGifs,
      favoriteStickers: _favoriteStickers,
      quickReactionEmojis: _quickReactionEmojis,
      spacePositions: _spacePositions,
      ...scalarPatch
    } = patch;

    Object.assign(this, scalarPatch);
    this.applySettingsSideEffects(patch);

    if (options?.sync === "immediate") {
      this.flush();
    }
  }

  patchExtendedSettings(
    patch: Partial<AccountSettingsPatch>,
    options?: { sync?: "debounced" | "immediate" },
  ) {
    this.patchSettings(patch, options);
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
    this.applySyncedSettings(payload as APIUserSettings);
  }

  private mergeRemoteSettings(remote: Partial<AccountSettingsPatch>) {
    const patch = mergeRemoteSettings(
      this.getSyncPayload(),
      this.syncEngine.syncedSnapshot,
      remote,
    );
    if (!patch) return;

    this.patchSettings(patch);
  }

  private applySettingsSideEffects(patch: Partial<AccountSettingsPatch>) {
    if (patch.replyWithMention != undefined) {
      this.app.replyMention = this.replyWithMention;
    }
    if (patch.defaultMemberListVisible != undefined) {
      this.app.memberListVisible = this.defaultMemberListVisible;
    }
  }

  update(settings: Partial<APIUserSettings>) {
    if (settings.spacePositions != undefined)
      this.spacePositions.replace(settings.spacePositions.map(String));

    const { spacePositions: _spacePositions, updatedAt, ...rest } = settings;

    if (this.isDirty) {
      this.mergeRemoteSettings(rest);
    } else if (Object.keys(rest).length > 0) {
      this.patchSettings(rest);
    }

    if (updatedAt != undefined) this.updatedAt = new Date(updatedAt);

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
