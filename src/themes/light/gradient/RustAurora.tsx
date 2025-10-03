import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const rustAuroraTheme: Theme = {
    ...baseLightTheme,
    id: "rustAurora",
    name: "Rust Aurora",
    description: "Warm, industrial gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#8A5F36",
        neutral: "#5A5142",
        background: "linear-gradient(135deg, #F7F5F3 0%, #EDE6E3 100%)",
        surface: "linear-gradient(135deg, #EDE6E3 0%, #A87C5A 100%)",
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
            accent: "#8A5F36",
            muted: "#5A5A5F",
        },
    },
};
