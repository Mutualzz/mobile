import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const rustRevivalTheme: Theme = {
    ...baseLightTheme,
    id: "rustRevival",
    name: "Rust Revival",
    description: "Warm industrial rust tones with an aged metal feel.",
    adaptive: false,
    style: "normal",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#8A5F36",
        neutral: "#5A5142",
        background: "#F6F3F0",
        surface: "#EDE4DD",
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
            accent: "#8A5F36",
            muted: "#5A5A5F",
        },
    },
};
