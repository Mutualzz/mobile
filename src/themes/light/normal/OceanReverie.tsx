import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const oceanReverieTheme: Theme = {
    ...baseLightTheme,
    id: "oceanReverie",
    name: "Ocean Reverie",
    description: "Deep Ocean Calm",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#3A5A4A",
        neutral: "#4A5555",
        background: "#F3F5F4",
        surface: "#E2E6E4",
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
            accent: "#3A5A4A",
            muted: "#5A5A5F",
        },
    },
};
