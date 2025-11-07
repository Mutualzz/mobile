import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const roseRequiemTheme: Theme = {
    ...baseLightTheme,
    id: "roseRequiem",
    name: "Rose Requiem",
    description: "Soft romantic palette with gentle rose accents.",
    adaptive: false,
    style: "normal",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#A23A4F",
        neutral: "#5A4652",
        background: "#F5F3F5",
        surface: "#EADFE5",
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
            accent: "#A23A4F",
            muted: "#5A5A5F",
        },
    },
};
