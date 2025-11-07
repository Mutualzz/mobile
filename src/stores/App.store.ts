import { Logger } from "@logger";
import type { APIPrivateUser, AppMode } from "@mutualzz/types";
import { themes } from "@themes/index";
import { secureStorageAdapter } from "@utils/secureStorageAdapter";
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { AccountStore } from "./Account.store";
import { DraftStore } from "./Draft.store";
import { GatewayStore } from "./Gateway.store";
import { REST } from "./REST.store";
import { ThemeStore } from "./Theme.store";
import { UserStore } from "./User.store";

export class AppStore {
    private readonly logger = new Logger({
        tag: "AppStore",
    });

    isGatewayReady = false;
    isAppLoading = true;

    token: string | null = null;

    account: AccountStore | null = null;
    gateway = new GatewayStore(this);
    draft = new DraftStore();
    theme = new ThemeStore(this);
    rest = new REST();
    users = new UserStore(this);

    version: string | null = null;

    mode: AppMode | null = null;

    constructor() {
        makeAutoObservable(this);

        makePersistable(this, {
            name: "AppStore",
            properties: ["token"],
            storage: secureStorageAdapter,
        });
    }

    setUser(user: APIPrivateUser) {
        this.account = new AccountStore(user);
        this.mode = user.settings.preferredMode;
    }

    setGatewayReady(ready: boolean) {
        this.isGatewayReady = ready;
    }

    setAppLoading(loading: boolean) {
        this.isAppLoading = loading;
    }

    setMode(mode: AppMode) {
        this.mode = mode;
    }

    resetMode() {
        this.mode = null;
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
        this.mode = null;
        this.rest.setToken(null);
        secureStorageAdapter.clear();
        this.resetMode();
        this.theme.reset();
    }

    async loadSettings() {
        this.loadToken();
        this.theme.loadThemes(themes);
    }
}
