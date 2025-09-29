import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const twilightElegyTheme: Theme = {
    ...baseLightTheme,
    id: "twilightElegy",
    name: "Twilight Elegy",
    description: "Gothic Violet Glow",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#6A7CA8",
        neutral: "#A8A8C0",
        background: "#F4F5F8",
        surface: "#E6E8EE",
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
            accent: "#6A4A8A",
            muted: "#3A3A5A",
        },
    },
};
