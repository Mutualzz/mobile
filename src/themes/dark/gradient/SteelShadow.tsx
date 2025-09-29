import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const steelShadowTheme: Theme = {
    ...baseDarkTheme,
    id: "steelShadow",
    name: "Steel Shadow",
    description: "Dystopian, sharp gradients",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#5A5A7A",
        neutral: "#8A8A8A",
        background: "linear-gradient(135deg, #1A191E 0%, #23243A 100%)",
        surface: "linear-gradient(135deg, #23243A 0%, #5A5A7A 100%)",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#B5B5B5",
            accent: "#5A5A7A",
            muted: "#8A8A8A",
        },
    },
};
