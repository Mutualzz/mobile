import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const phantomGraceTheme: Theme = {
    ...baseLightTheme,
    id: "phantomGrace",
    name: "Phantom Grace",
    description: "Eerie & Ethereal",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#4A7D79",
        neutral: "#4A5E5E",
        background: "#F4F7F6",
        surface: "#E6EEEC",
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
            accent: "#4A7D79",
            muted: "#5A5A5F",
        },
    },
};
