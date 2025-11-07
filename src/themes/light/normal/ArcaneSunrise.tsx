import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const arcaneSunriseTheme: Theme = {
    ...baseLightTheme,
    id: "arcaneSunrise",
    name: "Arcane Sunrise",
    description: "Warm mystical morning glow with soft green highlights.",
    adaptive: false,
    style: "normal",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#3A7C6A",
        neutral: "#5A4A3A",
        background: "#F6F3F0",
        surface: "#ECE6E2",
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
            accent: "#3A7C6A",
            muted: "#5A5A5F",
        },
    },
};
