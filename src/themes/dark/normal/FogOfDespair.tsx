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
        primary: "#63A9C8",
        neutral: "#A5B4C2",
        background: "#0D0F12",
        surface: "#1F252C",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#C9D8E0",
            accent: "#63A9C8",
            muted: "#97A9B8",
        },
    },
};
