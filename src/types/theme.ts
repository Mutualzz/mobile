import type { Theme } from "@emotion/react";
import type { APITheme } from "@mutualzz/types";
import type { ColorLike } from "@mutualzz/ui-core";

export type MzTheme = Theme & APITheme;

export interface ThemeDraft {
    name: string;
    description?: string;
    type: "dark" | "light";
    mode: "normal" | "gradient";
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
        info: ColorLike;
        success: ColorLike;
        warning: ColorLike;
    };
    typography: {
        colors: {
            primary: ColorLike;
            secondary: ColorLike;
            accent: ColorLike;
            muted: ColorLike;
        };
    };
}
