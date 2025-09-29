import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const silverDawnTheme: Theme = {
    ...baseLightTheme,
    id: "silverDawn",
    name: "Silver Dawn",
    description: "Industrial metallic gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#4A6A5A",
        neutral: "#8A8A8A",
        background: "linear-gradient(135deg, #F3F4F5 0%, #E2E4E6 100%)",
        surface: "linear-gradient(135deg, #E2E4E6 0%, #4A6A5A 100%)",
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
            accent: "#4A6A5A",
            muted: "#3A3A3A",
        },
    },
};
