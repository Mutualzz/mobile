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
        primary: "#D98098",
        neutral: "#D9C0CC",
        background: "#100D10",
        surface: "#261921",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#EBCDD7",
            accent: "#D98098",
            muted: "#CDAFB9",
        },
    },
};
