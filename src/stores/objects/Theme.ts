import type { Theme as MzTheme } from "@emotion/react";
import type { APITheme, ThemeStyle, ThemeType } from "@mutualzz/types";
import { baseDarkTheme, baseLightTheme } from "@mutualzz/ui-core";
import { makeAutoObservable } from "mobx";
import type { User } from "./User";

export class Theme {
    id: string;
    name: string;
    description: string;
    adaptive: boolean;
    type: ThemeType;
    style: ThemeStyle;
    colors: {
        common: {
            white: string;
            black: string;
        };
        primary: string;
        neutral: string;
        background: string;
        surface: string;
        danger: string;
        warning: string;
        info: string;
        success: string;
    };
    typography: {
        colors: {
            primary: string;
            secondary: string;
            accent: string;
            muted: string;
        };
    };
    created: Date;
    updated: Date;

    raw: APITheme;

    private _author: User | null = null;

    constructor(theme: APITheme | MzTheme) {
        theme = Theme.normalizeTheme(theme);

        this.id = theme.id;
        this.name = theme.name;
        this.description = theme.description;
        this.adaptive = theme.adaptive;
        this.type = theme.type;
        this.style = theme.style;
        this.colors = theme.colors;
        this.typography = theme.typography;

        this.created = new Date(theme.created);
        this.updated = new Date(theme.updated);

        this.raw = theme;

        makeAutoObservable(this);
    }

    get author() {
        return this._author;
    }

    set author(user: User | null) {
        this._author = user;
    }

    static normalizeTheme(theme: APITheme | MzTheme): APITheme {
        return {
            ...theme,
            createdAt: "createdAt" in theme ? theme.createdAt : new Date(0),
            createdTimestamp:
                "createdTimestamp" in theme ? theme.createdTimestamp : 0,
            updatedAt: "updatedAt" in theme ? theme.updatedAt : new Date(0),
            updatedTimestamp:
                "updatedTimestamp" in theme ? theme.updatedTimestamp : 0,
            createdBy: "createdBy" in theme ? theme.createdBy : undefined,
        } as unknown as APITheme;
    }

    static toEmotionTheme(theme: Theme | MzTheme): MzTheme {
        const toMergeWith =
            theme.type === "dark" ? baseDarkTheme : baseLightTheme;

        const newTheme = {
            ...toMergeWith,
            ...theme,
            typography: {
                ...toMergeWith.typography,
                ...theme.typography,
                colors: {
                    ...toMergeWith.typography.colors,
                    ...theme.typography?.colors,
                },
            },
        };

        return { ...toMergeWith, ...newTheme } as MzTheme;
    }

    update(theme: APITheme) {
        Object.assign(this, theme);
    }
}
