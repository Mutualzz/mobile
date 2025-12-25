import type { Theme as MzTheme } from "@emotion/react";
import type {
    APITheme,
    Snowflake,
    ThemeStyle,
    ThemeType,
} from "@mutualzz/types";
import { baseDarkTheme, baseLightTheme } from "@mutualzz/ui-core";
import type { AppStore } from "@stores/App.store";
import type { User } from "@stores/objects/User";
import { makeAutoObservable } from "mobx";

export class Theme {
    id: Snowflake;
    name: string;
    description?: string | null;
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
    createdAt: Date;
    updatedAt: Date;

    raw: APITheme;

    authorId?: Snowflake | null;
    author?: User | null;

    constructor(
        private readonly app: AppStore,
        theme: APITheme | MzTheme,
    ) {
        theme = Theme.normalizeTheme(theme);

        this.id = theme.id;
        this.name = theme.name;
        this.description = theme.description;
        this.adaptive = theme.adaptive;
        this.type = theme.type;
        this.style = theme.style;
        this.colors = theme.colors;
        this.typography = theme.typography;

        this.createdAt = new Date(theme.createdAt);
        this.updatedAt = new Date(theme.updatedAt);

        this.raw = theme;

        this.authorId = theme.authorId;
        if (theme.author) this.author = this.app.users.add(theme.author);

        makeAutoObservable(this);
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
