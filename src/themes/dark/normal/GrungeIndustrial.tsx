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
        primary: "#D09663",
        neutral: "#C4B48F",
        background: "#100F0D",
        surface: "#27241A",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#E1D3C0",
            accent: "#D09663",
            muted: "#B8AB88",
        },
    },
};
