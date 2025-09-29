import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const victorianBloomTheme: Theme = {
    ...baseLightTheme,
    id: "victorianBloom",
    name: "Victorian Bloom",
    description: "Dark Floral Light",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#A88A5A",
        neutral: "#A8A87A",
        background: "#F5F7F3",
        surface: "#E6EDE6",
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
            accent: "#A88A5A",
            muted: "#5A4A3A",
        },
    },
};
