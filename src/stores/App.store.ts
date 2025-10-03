import { Logger } from "@logger";
import { makeAutoObservable } from "mobx";
import { ThemeStore } from "./Theme.store";

export class AppStore {
    private readonly logger = new Logger({
        tag: "AppStore",
    });

    isAppLoading = true;

    theme = new ThemeStore();

    version: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    setAppLoading(loading: boolean) {
        this.isAppLoading = loading;
    }

    get isReady() {
        return !this.isAppLoading;
    }

    async loadSettings() {
        this.theme.loadDefaultThemes();
    }
}
