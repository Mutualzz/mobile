import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const twilightElegyTheme: Theme = {
    ...baseLightTheme,
    id: "twilightElegy",
    name: "Twilight Elegy",
    description: "Gothic Violet Glow",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#4A5FA0",
        neutral: "#4A4F63",
        background: "#F3F4F7",
        surface: "#E8EAF1",
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
            accent: "#4A5FA0",
            muted: "#5A5A5F",
        },
    },
};
