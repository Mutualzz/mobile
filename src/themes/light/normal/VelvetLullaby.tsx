import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const velvetLullabyTheme: Theme = {
    ...baseLightTheme,
    id: "velvetLullaby",
    name: "Velvet Lullaby",
    description: "Vintage, dramatic palette with soft rose tones.",
    adaptive: false,
    style: "normal",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#914F60",
        neutral: "#5A4652",
        background: "#F4F2F5",
        surface: "#E9E2EA",
        danger: "#B3261E",
        warning: "#8F6500",
        success: "#1F6E34",
        info: "#0F5DA8",
    },
    typography: {
        ...baseLightTheme.typography,
        colors: {
            primary: "#1A1A1A",
            secondary: "#3A3A3A",
            accent: "#914F60",
            muted: "#5A5A5F",
        },
    },
};
