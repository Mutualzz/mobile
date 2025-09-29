import type { Theme } from "@emotion/react";

import { baseDarkTheme } from "@mutualzz/ui-core";

export const grungeIndustrialTheme: Theme = {
    ...baseDarkTheme,
    id: "grungeIndustrial",
    name: "Grunge & Industrial",
    description: "90s Underground Aesthetic",
    type: "dark",
    mode: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#A87C5A",
        neutral: "#A89A7A",
        background: "#19171A",
        surface: "#23241A",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#C5B6AA",
            accent: "#A87C5A",
            muted: "#A89A7A",
        },
    },
};
