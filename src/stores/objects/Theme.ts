import type { Theme as MzTheme } from "@emotion/react";
import type { APITheme, ThemeStyle, ThemeType } from "@mutualzz/types";
import {
    baseDarkTheme,
    baseLightTheme,
    type ColorLike,
    type Hex,
} from "@mutualzz/ui-core";
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
            white: Hex;
            black: Hex;
        };
        primary: Hex;
        neutral: Hex;
        background: ColorLike;
        surface: ColorLike;
        danger: Hex;
        warning: Hex;
        info: Hex;
        success: Hex;
    };
    typography: {
        colors: {
            primary: Hex;
            secondary: Hex;
            accent: Hex;
            muted: Hex;
        };
    };
    createdAt: Date;
    createdTimestamp: number;
    updatedAt: Date;
    updatedTimestamp: number;

    raw: APITheme;

    private _createdBy: User | null = null;

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

        this.createdAt = theme.createdAt;
        this.createdTimestamp = theme.createdTimestamp;
        this.updatedAt = theme.updatedAt;
        this.updatedTimestamp = theme.updatedTimestamp;

        this.raw = theme;

        makeAutoObservable(this);
    }

    get createdBy() {
        return this._createdBy;
    }

    set createdBy(user: User | null) {
        this._createdBy = user;
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

    static toEmotionTheme(theme: Theme): MzTheme {
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

        return { ...toMergeWith, ...newTheme };
    }

    update(theme: APITheme) {
        Object.assign(this, theme);
    }
}
