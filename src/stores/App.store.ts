import { Logger } from "@mutualzz/logger";
import type {
  APIPrivateUser,
  APISpacePartial,
  APIUserSettings,
  AppMode,
} from "@mutualzz/types";
import { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { secureStorageAdapter } from "@utils/secureStorageAdapter";
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { AccountStore } from "./Account.store";
import { AccountSettingsStore } from "./AccountSettings.store";
import { ChannelStore } from "./Channel.store";
import { DraftStore } from "./Draft.store";
import { GatewayStore } from "./Gateway.store";
import { MessageQueue } from "./MessageQueue.store";
import { REST } from "./REST.store";
import { SpaceStore } from "./Space.store";
import { ThemeStore } from "./Theme.store";
import { UserStore } from "./User.store";
import { ThemeCreatorStore } from "@stores/ThemeCreator.store";
import { NavigationStore } from "@stores/Navigation.store";
import { ExpressionsStore } from "@stores/Expressions.store";
import { ReadStateStore } from "@stores/ReadState.store";
import { RelationshipStore } from "@stores/Relationship.store";
import { ProfileStore } from "@stores/Profile.store";
import { TypingStore } from "@stores/Typing.store";
import { PresenceStore } from "@stores/Presence.store";
import { CustomStatusStore } from "@stores/CustomStatus.store";
import { VoiceStore } from "@stores/Voice.store";
import { VoiceStatesStore } from "@stores/VoiceStates.store";
import type { User } from "@stores/objects/User";

export class AppStore {
  isGatewayReady = false;
  isAppLoading = true;
  hideSwitcher = false;
  token: string | null = null;
  account: AccountStore | null = null;
  presence = new PresenceStore();
  customStatus = new CustomStatusStore();
  voice = new VoiceStore(this);
  voiceStates = new VoiceStatesStore(this);
  channels = new ChannelStore(this);
  gateway = new GatewayStore(this);
  drafts = new DraftStore();
  navigation = new NavigationStore(this);
  spaces = new SpaceStore(this);
  queue = new MessageQueue(this);
  themes = new ThemeStore(this);
  themeCreator = new ThemeCreatorStore();
  rest = new REST();
  users = new UserStore(this);
  expressions = new ExpressionsStore(this);
  readStates = new ReadStateStore(this);
  relationships = new RelationshipStore(this);
  profiles = new ProfileStore(this);
  typing = new TypingStore(this);
  settings: AccountSettingsStore | null = null;
  version: string | null = null;
  mode: AppMode | null = null;
  joiningSpace?: APISpacePartial | null = null;
  joiningInviteCode?: string | null = null;
  queryClient: QueryClient;
  memberListVisible = true;
  dontShowLinkWarning = false;
  spacesDrawerOpen = true;
  dmDrawerOpen = true;

  private readonly logger = new Logger({
    tag: "AppStore",
  });

  constructor() {
    makeAutoObservable(this);

    this.queryClient = new QueryClient();

    makePersistable(this, {
      name: "AppStoreSecure",
      properties: ["token"],
      storage: secureStorageAdapter,
    });

    makePersistable(this, {
      name: "AppStore-Transient",
      properties: ["joiningSpace", "joiningInviteCode"],
      storage: AsyncStorage,
      expireIn: 60 * 1000, // 1 minutes in milliseconds
      removeOnExpiration: true,
    });

    makePersistable(this, {
      name: "AppStore",
      properties: ["memberListVisible", "dontShowLinkWarning"],
      storage: AsyncStorage,
    });
  }

  get isReady() {
    return !this.isAppLoading && this.isGatewayReady;
  }

  getSuggestedGroupDMRecipients(): User[] {
    const relationships = new Set(
      this.relationships.all
        .map((rel) => rel.otherUser)
        .filter((user): user is User => !!user),
    );

    const otherUsers = new Set(
      this.channels.dms.flatMap(
        (dm) =>
          dm.recipients?.filter((rcp) => rcp.id !== this.account?.id) ?? [],
      ),
    );

    const mutualSpaceUsers = new Set(
      this.spaces.all.flatMap((space) =>
        space.members.all
          .map((member) => member.user)
          .filter((user): user is User => !!user)
          .filter((user) => user.id !== this.account?.id),
      ),
    );

    return Array.from(
      new Set([...relationships, ...otherUsers, ...mutualSpaceUsers]),
    );
  }

  setDontShowLinkWarning(val: boolean) {
    this.dontShowLinkWarning = val;
  }

  setJoining(code?: string | null, space?: APISpacePartial | null) {
    this.joiningSpace = space;
    this.joiningInviteCode = code;
  }

  toggleMemberList() {
    this.memberListVisible = !this.memberListVisible;
  }

  setMode(mode: AppMode) {
    this.mode = mode;
  }

  resetMode() {
    this.mode = null;
  }

  setHideSwitcher(val: boolean) {
    this.hideSwitcher = val;
  }

  setSpacesDrawerOpen(val: boolean) {
    this.spacesDrawerOpen = val;
  }

  setDMDrawerOpen(val: boolean) {
    this.dmDrawerOpen = val;
  }

  setUser(user: APIPrivateUser, settings?: APIUserSettings) {
    if (this.account?.id === user.id) {
      this.account.update(user);
    } else {
      this.account = new AccountStore(user);
    }
    if (settings) {
      const pending = this.settings?.getPendingOverrides();
      this.settings?.dispose();
      const next = new AccountSettingsStore(this, settings);
      if (pending) next.applyLocalOverrides(pending);
      this.settings = next;
    }
  }

  setGatewayReady(ready: boolean) {
    this.isGatewayReady = ready;
  }

  setAppLoading(loading: boolean) {
    this.isAppLoading = loading;
  }

  setToken(token: string) {
    this.token = token;
    this.logger.debug("Token saved to the storage");
  }

  loadToken() {
    if (this.token) {
      this.setToken(this.token);
      this.logger.debug("Token loaded from the storage");
    } else {
      this.logger.warn("No token found in the storage");
      this.setGatewayReady(true);
    }
  }

  logout() {
    this.token = null;
    this.isAppLoading = false;
    this.isGatewayReady = true;
    this.account = null;
    if (this.settings) this.settings.dispose();
    this.settings = null;
    this.rest.setToken(null);
    this.themes.reset();
    this.expressions.clear();
    this.readStates.clear();
    this.relationships.clear();
    this.presence.clear();
    this.customStatus.clear();
    this.voiceStates.clear();
    secureStorageAdapter.clear();
  }

  async loadSettings() {
    if (this.settings) this.settings.startSyncing();
    this.loadToken();
    this.setAppLoading(false);
  }
}
