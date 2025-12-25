import { Logger } from "@mutualzz/logger";
import type {
    APIPrivateUser,
    APISpacePartial,
    APIUserSettings,
    AppMode,
} from "@mutualzz/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
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

export class AppStore {
    private readonly logger = new Logger({
        tag: "AppStore",
    });

    isGatewayReady = false;
    isAppLoading = true;
    hideSwitcher = false;

    token: string | null = null;

    account: AccountStore | null = null;
    channels = new ChannelStore(this);
    gateway = new GatewayStore(this);
    drafts = new DraftStore();
    spaces = new SpaceStore(this);
    queue = new MessageQueue(this);
    themes = new ThemeStore(this);
    rest = new REST();
    users = new UserStore(this);
    settings: AccountSettingsStore | null = null;

    version: string | null = null;

    mode: AppMode | null = null;

    joiningSpace?: APISpacePartial | null = null;
    joiningInviteCode?: string | null = null;

    queryClient: QueryClient;

    memberListVisible = true;
    dontShowLinkWarning = false;

    preferEmbossed = true;

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
            properties: [
                "memberListVisible",
                "dontShowLinkWarning",
                "preferEmbossed",
            ],
            storage: AsyncStorage,
        });
    }

    setPreferEmbossed(val: boolean) {
        this.preferEmbossed = val;
    }

    togglePreferEmbossed() {
        this.preferEmbossed = !this.preferEmbossed;
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

    setUser(user: APIPrivateUser, settings?: APIUserSettings) {
        this.account = new AccountStore(user);
        if (settings) this.settings = new AccountSettingsStore(this, settings);
    }

    setGatewayReady(ready: boolean) {
        this.isGatewayReady = ready;
    }

    setAppLoading(loading: boolean) {
        this.isAppLoading = loading;
    }

    get isReady() {
        return !this.isAppLoading && this.isGatewayReady;
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
        this.settings = null;
        this.rest.setToken(null);
        this.themes.reset();
        secureStorageAdapter.clear();
    }

    async loadSettings() {
        this.loadToken();
        this.setAppLoading(false);
    }
}
