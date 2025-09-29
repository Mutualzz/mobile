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
        primary: "#A87C5A",
        neutral: "#A89A7A",
        background: "linear-gradient(135deg, #F7F5F3 0%, #EDE6E3 100%)",
        surface: "linear-gradient(135deg, #EDE6E3 0%, #A87C5A 100%)",
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
            accent: "#A87C5A",
            muted: "#5A4A3A",
        },
    },
};
