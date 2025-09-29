import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const phantomGraceTheme: Theme = {
    ...baseLightTheme,
    id: "phantomGrace",
    name: "Phantom Grace",
    description: "Eerie & Ethereal",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#7CA8A6",
        neutral: "#A8C0C0",
        background: "#F4F7F6",
        surface: "#E6EEEC",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseLightTheme.typography,
        colors: {
            primary: "#222222",
            secondary: "#333333",
            accent: "#6A6A8A",
            muted: "#3A3A4A",
        },
    },
};
