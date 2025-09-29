import type { Theme } from "@emotion/react";

import { baseDarkTheme } from "@mutualzz/ui-core";

export const melancholyRomanceTheme: Theme = {
    ...baseDarkTheme,
    id: "melancholyRomance",
    name: "Melancholy Romance",
    description: "Dramatic, Vintage, and Elegant",
    type: "dark",
    mode: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#A86A7A",
        neutral: "#B8A8B8",
        background: "#181218",
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
            secondary: "#C0A5AF",
            accent: "#A86A7A",
            muted: "#B8A8B8",
        },
    },
};
