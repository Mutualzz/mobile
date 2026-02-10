import type { Theme as MzTheme } from "@emotion/react";
import type { APITheme, ThemeType } from "@mutualzz/types";
import { makeAutoObservable, observable, type ObservableMap } from "mobx";
import { makePersistable } from "mobx-persist-store";
import type { AppStore } from "./App.store";
import { Theme } from "./objects/Theme";

import { baseDarkTheme } from "@mutualzz/ui-core";
import { themes as baseThemes } from "@themes/index";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class ThemeStore {
    readonly themes: ObservableMap<string, Theme>;

    currentType: ThemeType | null = null;

    // NOTE: If the currentTheme is null, it means using the system preference
    currentTheme: string | null = null;
    // NOTE: If the currentIcon is null, it means its adaptive to the theme
    currentIcon: string | null = null;

    constructor(private readonly app: AppStore) {
        this.themes = observable.map(
            baseThemes.map((t) => [t.id, new Theme(this.app, t)]),
        );
        makeAutoObservable(this);

        makePersistable(this, {
            name: "ThemeStore",
            properties: ["currentTheme", "currentIcon"],
            storage: AsyncStorage,
        });
    }

    setCurrentTheme(themeId: string | null) {
        this.currentTheme = themeId;
    }

    setCurrentType(type: ThemeType | null) {
        this.currentType = type;
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
        const newTheme = new Theme(this.app, theme);
        this.themes.set(theme.id, newTheme);
        return newTheme;
    }

    update(theme: APITheme) {
        return this.themes.get(theme.id)?.update(theme);
    }

    get(id: string) {
        return this.themes.get(id) ?? baseDarkTheme;
    }

    get all() {
        return Array.from(this.themes.values());
    }

    remove(id: string) {
        this.themes.delete(id);

        if (this.currentTheme === id) this.currentTheme = null;
    }
}
