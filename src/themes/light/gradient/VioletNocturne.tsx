import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const violetNocturneTheme: Theme = {
    ...baseLightTheme,
    id: "violetNocturne",
    name: "Violet Nocturne",
    description: "Gothic violet gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#4A5FA0",
        neutral: "#4A4F63",
        background: "linear-gradient(135deg, #F4F5F8 0%, #E6E8EE 100%)",
        surface: "linear-gradient(135deg, #E6E8EE 0%, #6A7CA8 100%)",
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
