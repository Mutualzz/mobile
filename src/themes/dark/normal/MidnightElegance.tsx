import type { Theme } from "@emotion/react";

import { baseDarkTheme } from "@mutualzz/ui-core";

export const midnightEleganceTheme: Theme = {
    ...baseDarkTheme,
    id: "midnightElegance",
    name: "Midnight Elegance",
    description: "Dark Victorian Vibes",
    type: "dark",
    mode: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#6A4A8A",
        neutral: "#8A7CA8",
        background: "#18161C",
        surface: "#23203A",
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
            accent: "#6A4A8A",
            muted: "#8A7CA8",
        },
    },
};
