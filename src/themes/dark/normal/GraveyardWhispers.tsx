import type { Theme } from "@emotion/react";

import { baseDarkTheme } from "@mutualzz/ui-core";

export const graveyardWhispersTheme: Theme = {
    ...baseDarkTheme,
    id: "graveyardWhispers",
    name: "Graveyard Whispers",
    description: "Muted, Eerie, and Cold",
    type: "dark",
    mode: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#7A7A8A",
        neutral: "#7A8A9A",
        background: "#19171D",
        surface: "#23243A",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#C2C2C2",
            accent: "#7A7A8A",
            muted: "#7A8A9A",
        },
    },
};
