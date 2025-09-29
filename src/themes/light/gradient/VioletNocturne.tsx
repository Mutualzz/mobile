import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const violetNocturneTheme: Theme = {
    ...baseLightTheme,
    id: "violetNocturne",
    name: "Violet Nocturne",
    description: "Gothic violet gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#6A7CA8",
        neutral: "#A8A8C0",
        background: "linear-gradient(135deg, #F4F5F8 0%, #E6E8EE 100%)",
        surface: "linear-gradient(135deg, #E6E8EE 0%, #6A7CA8 100%)",
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
