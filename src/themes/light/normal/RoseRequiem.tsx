import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const roseRequiemTheme: Theme = {
    ...baseLightTheme,
    id: "roseRequiem",
    name: "Rose Requiem",
    description: "Romantic & Soft Light",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#A23A4F",
        neutral: "#A88A9A",
        background: "#F6F4F6",
        surface: "#EDE6EC",
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
            accent: "#A23A4F",
            muted: "#A88A9A",
        },
    },
};
