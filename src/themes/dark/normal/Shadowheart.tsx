import type { Theme } from "@emotion/react";

import { baseDarkTheme } from "@mutualzz/ui-core";

export const shadowheartTheme: Theme = {
    ...baseDarkTheme,
    id: "shadowheart",
    name: "Shadowheart",
    description: "Dystopian, Sharp, and Industrial",
    type: "dark",
    mode: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#5A5A7A",
        neutral: "#8A8A8A",
        background: "#1A191E",
        surface: "#23243A",
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
            accent: "#5A5A7A",
            muted: "#8A8A8A",
        },
    },
};
