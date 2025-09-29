import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const fogOfDespairTheme: Theme = {
    ...baseDarkTheme,
    id: "fogOfDespair",
    name: "Fog of Despair",
    description: "Cold, Distant, and Ethereal",
    type: "dark",
    mode: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#5A7C8A",
        neutral: "#7A8A9A",
        background: "#181A1D",
        surface: "#23232A",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#BFD0D9",
            accent: "#5A7C8A",
            muted: "#7A8A9A",
        },
    },
};
