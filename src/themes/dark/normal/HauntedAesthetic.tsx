import type { Theme } from "@emotion/react";

import { baseDarkTheme } from "@mutualzz/ui-core";

export const hauntedAestheticTheme: Theme = {
    ...baseDarkTheme,
    id: "hauntedAesthetic",
    name: "Haunted Aesthetic",
    description: "Ethereal, Eerie, and Softly Dark",
    type: "dark",
    mode: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#6A7CA8",
        neutral: "#7A8A9A",
        background: "#191919",
        surface: "#23232A",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#B5B5B5",
            accent: "#6A7CA8",
            muted: "#7A8A9A",
        },
    },
};
