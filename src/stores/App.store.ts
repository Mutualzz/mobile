import { Logger } from "@logger";
import { makeAutoObservable } from "mobx";
import { ThemeStore } from "./Theme.store";

export class AppStore {
    private readonly logger = new Logger({
        tag: "AppStore",
    });

    theme = new ThemeStore();

    constructor() {
        makeAutoObservable(this);
    }
}
