import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const mysticAuroraTheme: Theme = {
    ...baseLightTheme,
    id: "mysticAurora",
    name: "Mystic Aurora",
    description: "Magical morning gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#3A7C6A",
        neutral: "#7A6A5A",
        background: "linear-gradient(135deg, #F7F5F3 0%, #EDE9E6 100%)",
        surface: "linear-gradient(135deg, #EDE9E6 0%, #3A7C6A 100%)",
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
            accent: "#3A7C6A",
            muted: "#3A4A5A",
        },
    },
};
