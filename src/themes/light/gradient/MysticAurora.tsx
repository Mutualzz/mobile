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
        neutral: "#5A4A3A",
        background: "linear-gradient(135deg, #F7F5F3 0%, #EDE9E6 100%)",
        surface: "linear-gradient(135deg, #EDE9E6 0%, #3A7C6A 100%)",
        danger: "#B3261E",
        warning: "#8F6500",
        success: "#1F6E34",
        info: "#0F5DA8",
    },
    typography: {
        ...baseLightTheme.typography,
        colors: {
            primary: "#1A1A1A",
            secondary: "#3A3A3A",
            accent: "#3A7C6A",
            muted: "#5A5A5F",
        },
    },
};
