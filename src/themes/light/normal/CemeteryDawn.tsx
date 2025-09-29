import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const cemeteryDawnTheme: Theme = {
    ...baseLightTheme,
    id: "cemeteryDawn",
    name: "Cemetery Dawn",
    description: "Muted Morning Mist",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#7A5A5A",
        neutral: "#8A7A7A",
        background: "#F6F6F7",
        surface: "#E6E6EA",
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
            accent: "#7A5A5A",
            muted: "#4A3A3A",
        },
    },
};
