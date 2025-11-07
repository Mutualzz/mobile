import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const shadowheartTheme: Theme = {
    ...baseDarkTheme,
    id: "shadowheart",
    name: "Shadowheart",
    description: "Dystopian industrial palette with cool steel accents.",
    adaptive: false,
    type: "dark",
    style: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#7F82B0",
        neutral: "#B0B0B8",
        background: "#101118",
        surface: "#272C3A",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#D0D0D4",
            accent: "#7F82B0",
            muted: "#A0A0AA",
        },
    },
};
