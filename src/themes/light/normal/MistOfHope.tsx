import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const mistOfHopeTheme: Theme = {
    ...baseLightTheme,
    id: "mistOfHope",
    name: "Mist of Hope",
    description: "Soft, uplifting tones with airy blue-gray hints.",
    adaptive: false,
    style: "normal",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#3F6070",
        neutral: "#4A5360",
        background: "#F3F5F7",
        surface: "#E9EEF2",
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
            accent: "#3F6070",
            muted: "#5A5A5F",
        },
    },
};
