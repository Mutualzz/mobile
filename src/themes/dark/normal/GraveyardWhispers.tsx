import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const graveyardWhispersTheme: Theme = {
    ...baseDarkTheme,
    id: "graveyardWhispers",
    name: "Graveyard Whispers",
    description: "Muted, Eerie, and Cold",
    type: "dark",
    style: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#9A9AAF",
        neutral: "#A5B4C2",
        background: "#0E0E11",
        surface: "#222634",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#D0D6DE",
            accent: "#9A9AAF",
            muted: "#97A9B8",
        },
    },
};
