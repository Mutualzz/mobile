import type { MzTheme } from "@app-types/theme";
import { Logger } from "@logger";
import type { APITheme, APIUser } from "@mutualzz/types";
import {
    baseDarkTheme,
    baseLightTheme,
    type ThemeMode,
} from "@mutualzz/ui-core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { themes as defaultThemes } from "@themes/index";
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";

export class ThemeStore {
    private readonly logger = new Logger({
        tag: "ThemeStore",
    });

    themes: MzTheme[] = [];

    currentTheme: string | null = null;

    currentMode: ThemeMode = "system";

    defaultThemesLoaded = false;
    userThemesLoaded = false;

    constructor() {
        makeAutoObservable(this);

        makePersistable(this, {
            name: "ThemeStore",
            properties: ["currentTheme", "currentMode"],
            storage: AsyncStorage,
        });
    }

    setCurrentTheme(themeId: string | null) {
        this.currentTheme = themeId;
    }

    setCurrentMode(mode: ThemeMode) {
        this.currentMode = mode;
    }

    reset() {
        const defaultThemeIds = defaultThemes.map((t) => t.id);
        this.themes = this.themes.filter((t) => defaultThemeIds.includes(t.id));
        this.userThemesLoaded = false;
    }

    loadDefaultThemes() {
        defaultThemes.forEach((theme) => {
            const themeWithMetadata = {
                ...theme,
                createdAt: new Date(0),
                createdTimestamp: 0,
                updatedAt: new Date(0),
                updatedTimestamp: 0,
                createdBy: undefined,
            };
            this.addTheme(themeWithMetadata);
        });

        this.defaultThemesLoaded = true;
        this.logger.debug("Default themes loaded");
    }

    addTheme(theme: APITheme) {
        if (this.themes.find((t) => t.id === theme.id)) {
            this.logger.warn(`Theme ${theme.id} already exists.`);
            return;
        }

        let themeToMergedWith;
        if (theme.type === "light") themeToMergedWith = baseLightTheme;
        else themeToMergedWith = baseDarkTheme;

        const newTheme = {
            ...themeToMergedWith,
            ...theme,
            typography: {
                ...themeToMergedWith.typography,
                ...theme.typography,
                colors: {
                    ...themeToMergedWith.typography.colors,
                    ...theme.typography?.colors,
                },
            },
        };

        this.themes = [...this.themes, newTheme];
    }

    loadThemes() {
        this.loadDefaultThemes();
    }

    updateTheme(theme: APITheme) {
        const existingTheme = this.themes.find((t) => t.id === theme.id);
        if (!existingTheme) {
            this.logger.warn(`Theme ${theme.id} does not exist.`);
            return;
        }

        const updatedTheme = {
            ...existingTheme,
            ...theme,
            typography: {
                ...existingTheme.typography,
                ...theme.typography,
                colors: {
                    ...existingTheme.typography.colors,
                    ...theme.typography?.colors,
                },
            },
        };

        this.themes = this.themes.map((t) =>
            t.id === theme.id ? updatedTheme : t,
        );
    }

    removeTheme(themeId: string) {
        if (!this.themes.find((t) => t.id === themeId)) {
            this.logger.warn(`Theme ${themeId} does not exist.`);
            return;
        }

        this.themes = this.themes.filter((t) => t.id !== themeId);
    }

    loadUserThemes(user: APIUser) {
        const userThemes = user.themes ?? [];
        if (userThemes.length === 0) {
            this.logger.debug("No user themes found");
            this.userThemesLoaded = true; // Set to true even if none found
            return;
        }
        userThemes.forEach((theme) => this.addTheme(theme));
        this.userThemesLoaded = true;
        this.logger.debug("User themes loaded");
    }
}
