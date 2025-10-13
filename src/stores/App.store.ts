import { Logger } from "@logger";
import type { APIPrivateUser } from "@mutualzz/types";
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
    theme = new ThemeStore();
    rest = new REST();
    users = new UserStore(this);

    version: string | null = null;

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
        this.theme.loadUserThemes(user);
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
        this.rest.setToken(null);
        secureStorageAdapter.clear();
        this.theme.reset();
    }

    async loadSettings() {
        this.loadToken();
        this.theme.loadDefaultThemes();
    }
}
