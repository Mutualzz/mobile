import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const crimsonLamentTheme: Theme = {
    ...baseDarkTheme,
    id: "crimsonLament",
    name: "Crimson Lament",
    description: "Dark Romance & Tragedy",
    type: "dark",
    mode: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#A23A4F",
        neutral: "#A88A9A",
        background: "#18161A",
        surface: "#23141A",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#E0B0B0",
            accent: "#A23A4F",
            muted: "#A88A9A",
        },
    },
};
