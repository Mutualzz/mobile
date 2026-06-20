import type { Theme as MzTheme } from "@emotion/react";
import type { APITheme, Snowflake, ThemeStyle, ThemeType } from "@mutualzz/types";
import {
    baseDarkTheme,
    baseLightTheme,
    type ColorLike,
    type TypographyLevel,
    type TypographyLevelObj,
} from "@mutualzz/ui-core";
import type { AppStore } from "@stores/App.store";
import type { User } from "@stores/objects/User";
import { isLoadedRelation, omitBooleanRelations } from "@utils/apiRelations";
import { computed, makeAutoObservable, observable, toJS } from "mobx";

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

    _author!: User | null;

    constructor(
        private readonly app: AppStore,
        theme: APITheme,
    ) {
        this._author = null;

        this.id = theme.id;
        this.name = theme.name;
        this.description = theme.description;
        this.adaptive = theme.adaptive;
        this.type = theme.type;
        this.style = theme.style;
        this.colors = theme.colors;
        this.typography = {
            ...theme.typography,
            levels: {
                ...(theme.type === "dark"
                    ? baseDarkTheme.typography.levels
                    : baseLightTheme.typography.levels),
                ...theme.typography.levels,
            },
        };

        if (theme.createdAt) this.createdAt = new Date(theme.createdAt);
        if (theme.updatedAt) this.updatedAt = new Date(theme.updatedAt);

        this.raw = omitBooleanRelations(theme, ["author"]);

        this.authorId = theme.authorId;
        if (isLoadedRelation(theme.author)) {
            this._author = this.app.users.add(theme.author);
        }

        makeAutoObservable(
            this,
            {
                _author: observable.ref,
                author: computed,
            },
            { autoBind: true },
        );
    }

    get author() {
        if (!this.authorId) return null;
        return this.app.users.get(this.authorId) || this._author;
    }

    static toEmotion(theme: APITheme | MzTheme | Theme): MzTheme {
        const toMergeWith =
            theme.type === "dark" ? baseDarkTheme : baseLightTheme;

        const themeToUse = toJS(theme);

        return {
            ...toMergeWith,
            ...themeToUse,
            spacing: toMergeWith.spacing,
            shadows: toMergeWith.shadows,
            breakpoints: toMergeWith.breakpoints,
            zIndex: toMergeWith.zIndex,
            colors: {
                ...toMergeWith.colors,
                ...themeToUse.colors,
            },
            typography: {
                ...toMergeWith.typography,
                ...themeToUse.typography,
                levels: {
                    ...toMergeWith.typography.levels,
                    ...themeToUse.typography?.levels,
                },
                colors: {
                    ...toMergeWith.typography.colors,
                    ...themeToUse.typography?.colors,
                },
            },
        };
    }

    static serialize(theme: Theme | APITheme): APITheme {
        return {
            id: theme.id,
            name: theme.name,
            description: theme.description,
            adaptive: theme.adaptive,
            type: theme.type,
            style: theme.style,
            colors: theme.colors,
            typography: theme.typography,
            createdAt: theme.createdAt,
            updatedAt: theme.updatedAt,
            authorId: theme.authorId,
        };
    }

    update(theme: APITheme) {
        this.id = theme.id;
        this.name = theme.name;
        this.description = theme.description;
        this.adaptive = theme.adaptive;
        this.type = theme.type;
        this.style = theme.style;
        this.colors = theme.colors;
        this.typography = {
            ...theme.typography,
            levels: {
                ...(theme.type === "dark"
                    ? baseDarkTheme.typography.levels
                    : baseLightTheme.typography.levels),
                ...theme.typography.levels,
            },
        };

        if (theme.createdAt) this.createdAt = new Date(theme.createdAt);
        else this.createdAt = undefined;

        if (theme.updatedAt) this.updatedAt = new Date(theme.updatedAt);
        else this.updatedAt = undefined;

        this.authorId = theme.authorId ?? null;

        if (isLoadedRelation(theme.author)) {
            this._author = this.app.users.add(theme.author);
        }

        this.raw = omitBooleanRelations(theme, ["author"]);
    }
}
