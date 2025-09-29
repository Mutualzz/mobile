import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const rustRevivalTheme: Theme = {
    ...baseLightTheme,
    id: "rustRevival",
    name: "Rust Revival",
    description: "Industrial Warm Rust",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#A87C5A",
        neutral: "#A89A7A",
        background: "#F7F5F3",
        surface: "#EDE6E3",
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
