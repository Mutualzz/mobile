import type { Theme as MzTheme } from "@emotion/react";
import { Logger } from "@logger";
import type { APITheme } from "@mutualzz/types";
import {
    baseDarkTheme,
    baseLightTheme,
    type ThemeStyle,
    type ThemeType,
} from "@mutualzz/ui-core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable, observable, ObservableMap } from "mobx";
import { makePersistable } from "mobx-persist-store";
import type { AppStore } from "./App.store";
import { Theme } from "./objects/Theme";

export class ThemeStore {
    private readonly app: AppStore;

    private readonly logger = new Logger({
        tag: "ThemeStore",
    });

    readonly themes: ObservableMap<string, Theme>;

    currentTheme: string | null = null;
    currentType: ThemeType = "system";
    currentStyle: ThemeStyle = "normal";

    constructor(app: AppStore) {
        this.app = app;

        this.themes = observable.map();
        makeAutoObservable(this);

        makePersistable(this, {
            name: "ThemeStore",
            properties: ["currentTheme", "currentType", "currentStyle"],
            storage: AsyncStorage,
        });
    }

    setCurrentTheme(themeId: string | null) {
        this.currentTheme = themeId;
    }

    setCurrentType(type: ThemeType) {
        this.currentType = type;
    }

    setCurrentStyle(style: ThemeStyle) {
        this.currentStyle = style;
    }

    reset() {
        this.themes.clear();
        this.themes.set(baseDarkTheme.id, new Theme(baseDarkTheme));
        this.themes.set(baseLightTheme.id, new Theme(baseLightTheme));
    }

    loadThemes(themes: (APITheme | MzTheme)[]) {
        themes.forEach((theme) => this.add(theme));
    }

    add(theme: APITheme | MzTheme) {
        if (this.themes.has(theme.id)) {
            this.logger.warn(`Theme ${theme.id} already exists.`);
            return;
        }

        const newTheme = new Theme(theme);
        if ("createdBy" in theme && theme.createdBy)
            newTheme.createdBy = this.app.users.get(theme.createdBy) ?? null;

        this.themes.set(newTheme.id, newTheme);
        this.logger.debug(`Added theme: ${newTheme.id}`);
    }

    update(theme: APITheme) {
        const existingTheme = this.themes.get(theme.id);
        if (!existingTheme) {
            this.logger.warn(`Theme ${theme.id} does not exist.`);
            return;
        }

        existingTheme.update(theme);
    }

    remove(themeId: string) {
        if (!this.themes.has(themeId)) {
            this.logger.warn(`Theme ${themeId} does not exist.`);
            return;
        }

        this.themes.delete(themeId);
    }
}
