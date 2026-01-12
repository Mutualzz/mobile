import type { Theme as MzTheme } from "@emotion/react";
import type {
    APITheme,
    Snowflake,
    ThemeStyle,
    ThemeType,
} from "@mutualzz/types";
import {
    baseDarkTheme,
    baseLightTheme,
    type ColorLike,
    type TypographyLevel,
    type TypographyLevelObj,
} from "@mutualzz/ui-core";
import type { AppStore } from "@stores/App.store";
import type { User } from "@stores/objects/User";
import { makeAutoObservable, toJS } from "mobx";

export class Theme implements Partial<MzTheme> {
    id: Snowflake;
    name: string;
    description?: string | null;
    adaptive: boolean;
    type: ThemeType;
    style: ThemeStyle;
    colors: {
        common: {
            white: ColorLike;
            black: ColorLike;
        };
        primary: ColorLike;
        neutral: ColorLike;
        background: ColorLike;
        surface: ColorLike;
        danger: ColorLike;
        warning: ColorLike;
        info: ColorLike;
        success: ColorLike;
    };
    typography: {
        fontFamily: string;
        colors: {
            primary: ColorLike;
            secondary: ColorLike;
            accent: ColorLike;
            muted: ColorLike;
        };
        levels: Record<TypographyLevel, TypographyLevelObj>;
    };
    createdAt?: Date;
    updatedAt?: Date;

    raw: APITheme;

    authorId?: Snowflake | null;
    author?: User | null;

    constructor(
        private readonly app: AppStore,
        theme: APITheme,
    ) {
        this.id = theme.id;
        this.name = theme.name;
        this.description = theme.description;
        this.adaptive = theme.adaptive;
        this.type = theme.type;
        this.style = theme.style;
        this.colors = theme.colors;
        this.typography = theme.typography;

        if (theme.createdAt) this.createdAt = new Date(theme.createdAt);
        if (theme.updatedAt) this.updatedAt = new Date(theme.updatedAt);

        this.raw = theme;

        this.authorId = theme.authorId;
        if (theme.author) this.author = this.app.users.add(theme.author);

        makeAutoObservable(this);
    }

    static toEmotionTheme(theme: APITheme | MzTheme | Theme): MzTheme {
        const toMergeWith =
            theme.type === "dark" ? baseDarkTheme : baseLightTheme;

        const themeToUse = toJS(theme);

        const newTheme = {
            ...toMergeWith,
            ...themeToUse,
            colors: {
                ...toMergeWith.colors,
                ...themeToUse.colors,
            },
            typography: {
                ...toMergeWith.typography,
                ...themeToUse.typography,
                colors: {
                    ...toMergeWith.typography.colors,
                    ...themeToUse.typography?.colors,
                },
            },
        };

        return newTheme;
    }

    static toThemeObject(theme: APITheme, app: AppStore): Theme {
        return new Theme(app, theme);
    }

    update(theme: APITheme) {
        Object.assign(this, theme);
    }
}
