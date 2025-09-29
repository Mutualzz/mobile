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
        neutral: "#7A8A8A",
        background: "#F3F5F4",
        surface: "#E2E6E4",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseLightTheme.typography,
        colors: {
            primary: "#222222",
            secondary: "#333333",
            accent: "#3A5A4A",
            muted: "#3A3A3A",
        },
    },
};
