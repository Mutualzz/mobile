import type { Theme as MzTheme } from "@emotion/react";
import { Logger } from "@mutualzz/logger";
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
import { useColorScheme } from "react-native";
import type { AppStore } from "./App.store";
import { Theme } from "./objects/Theme";

export class ThemeStore {
    private readonly logger = new Logger({
        tag: "ThemeStore",
    });

    readonly themes: ObservableMap<string, Theme>;

    currentTheme: string | null = null;

    // NOTE: If the currentIcon is null, it means its adaptive to the theme
    currentIcon: string | null = null;

    currentType: ThemeType = "system";
    currentStyle: ThemeStyle = "normal";

    constructor(private readonly app: AppStore) {
        this.themes = observable.map();
        makeAutoObservable(this);

        makePersistable(this, {
            name: "ThemeStore",
            properties: [
                "currentTheme",
                "currentType",
                "currentStyle",
                "currentIcon",
            ],
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

    setCurrentIcon(icon: string | null) {
        this.currentIcon = icon;
    }

    addAll(themes: (APITheme | MzTheme)[]) {
        themes.forEach((theme) => this.add(theme));
    }

    reset() {
        this.themes.forEach((theme) => {
            if (theme.author) this.themes.delete(theme.id);
        });
    }

    add(theme: APITheme | MzTheme) {
        if (this.themes.has(theme.id)) {
            this.logger.warn(`Theme ${theme.id} already exists.`);
            return;
        }

        const newTheme = new Theme(theme);
        if ("author" in theme && theme.author)
            newTheme.author = this.app.users.get(theme.author) ?? null;

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

    get(id: string) {
        return this.themes.get(id) ?? baseDarkTheme;
    }

    get all() {
        return Array.from(this.themes.values());
    }

    remove(id: string) {
        if (!this.themes.has(id)) {
            this.logger.warn(`Theme ${id} does not exist.`);
            return;
        }

        this.themes.delete(id);

        if (this.currentTheme === id)
            this.currentTheme =
                useColorScheme() === "dark"
                    ? baseDarkTheme.id
                    : baseLightTheme.id;
    }
}
