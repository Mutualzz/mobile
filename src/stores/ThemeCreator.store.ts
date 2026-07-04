import {
    baseDarkTheme,
    baseLightTheme,
    type ThemeStyle,
    type ThemeType,
} from "@mutualzz/ui-core";
import type { APITheme } from "@mutualzz/types";
import type { Theme as MzTheme } from "@emotion/react";
import { type IObservableArray, makeAutoObservable, observable } from "mobx";
import { Theme } from "@stores/objects/Theme";
import { adaptColors } from "@utils/adaptation";
import { Appearance } from "react-native";

type ApiErrors = Record<string, string>;

export type ThemeCreatorCategory = "general" | "colors";
export type ThemeCreatorPage =
    | "details"
    | "base"
    | "feedback"
    | "typography"
    | "adaptive"
    | "manage";

export type ThemeCreatorLoadedType = "default" | "draft" | "custom";

export type ThemeCreatorFilter = ThemeType | ThemeStyle | "adaptive";

// TODO: Finish implementing the store from the old context
export class ThemeCreatorStore {
    currentCategory: ThemeCreatorCategory = "general";
    currentPage: ThemeCreatorPage = "details";
    values: APITheme;
    inPreview = false;
    themeBeforePreview: APITheme | null = null;
    filters: IObservableArray<ThemeCreatorFilter> = observable.array([]);
    loadedType: ThemeCreatorLoadedType = "default";
    errors: ApiErrors = {};
    userInteracted = false;
    private readonly prefersDark: boolean;

    constructor() {
        this.prefersDark = Appearance.getColorScheme() === "dark";

        const base = this.prefersDark ? baseDarkTheme : baseLightTheme;

        this.values = Theme.serialize({
            ...base,
            id: "",
            name: "",
            description: "",
        });

        makeAutoObservable(
            this,
            {},
            {
                autoBind: true,
            },
        );
    }

    get nameEmpty() {
        return this.values.name.trim() === "";
    }

    setCurrentCategory(category: ThemeCreatorCategory) {
        this.currentCategory = category;
    }

    setCurrentPage(page: ThemeCreatorPage) {
        this.currentPage = page;
    }

    setErrors(errors: ApiErrors) {
        this.errors = errors;
    }

    setValues(newValues: Partial<APITheme>) {
        this.values = Theme.serialize({ ...this.values, ...newValues });
        if (!this.userInteracted) this.userInteracted = true;
        if (this.loadedType === "default") this.loadedType = "custom";
    }

    loadValues(theme: APITheme) {
        if (this.loadedType === "default") {
            this.values = Theme.serialize({
                ...this.values,
                id: "",
                name: "",
                description: "",
            });
            if (this.userInteracted) this.userInteracted = false;
            return;
        }

        this.values = Theme.serialize(theme);
        if (!this.userInteracted) this.userInteracted = true;
    }

    resetValues() {
        const base = this.prefersDark ? baseDarkTheme : baseLightTheme;

        this.values = Theme.serialize({
            ...base,
            id: "",
            name: "",
            description: "",
        });

        if (this.userInteracted) this.userInteracted = false;
        if (this.loadedType !== "default") this.loadedType = "default";

        this.errors = {};
        this.currentPage = "details";
        this.currentCategory = "general";
    }

    addFilter(filter: ThemeCreatorFilter) {
        if (!this.filters.includes(filter)) this.filters.push(filter);
    }

    removeFilter(filter: ThemeCreatorFilter) {
        if (!this.filters.includes(filter)) return;
        this.filters.remove(filter);
    }

    setFilters(filters: ThemeCreatorFilter[]) {
        this.filters.replace(filters);
    }

    resetFilters() {
        this.filters.clear();
    }

    filter(themes: Theme[]) {
        if (this.filters.length === 0) return themes;

        return themes.filter((theme) =>
            this.filters.some(
                (filter) =>
                    theme.type === filter ||
                    theme.style === filter ||
                    (filter === "adaptive" && theme.adaptive),
            ),
        );
    }

    setLoadedType(type: ThemeCreatorLoadedType) {
        this.loadedType = type;
    }

    startPreview(
        changeTheme: (theme: MzTheme) => void,
        currentThemeValues?: APITheme,
    ) {
        if (this.inPreview) return;

        let previewThemeValues = this.values;

        if (this.values.adaptive)
            previewThemeValues = Theme.serialize({
                ...this.values,
                ...(adaptColors({
                    baseColor: this.values.colors.background,
                    primaryColor: this.values.colors.primary,
                    primaryText: this.values.typography.colors.primary,
                }) as Partial<APITheme>),
            });

        if (!this.themeBeforePreview && currentThemeValues)
            this.themeBeforePreview = Theme.serialize(currentThemeValues);

        changeTheme(Theme.toEmotion(previewThemeValues));
        this.inPreview = true;
    }

    stopPreview(changeTheme: (theme: MzTheme) => void) {
        if (!this.inPreview) return;

        if (this.themeBeforePreview)
            changeTheme(Theme.toEmotion(this.themeBeforePreview));

        this.themeBeforePreview = null;
        this.inPreview = false;
    }
}
