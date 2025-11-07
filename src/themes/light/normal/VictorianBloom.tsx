import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const victorianBloomTheme: Theme = {
    ...baseLightTheme,
    id: "victorianBloom",
    name: "Victorian Bloom",
    description: "Light theme with Victorian floral tones and muted warmth.",
    adaptive: false,
    style: "normal",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#8A6C36",
        neutral: "#5A5842",
        background: "#F5F6F1",
        surface: "#EBF1EA",
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
            accent: "#8A6C36",
            muted: "#5A5A5F",
        },
    },
};
