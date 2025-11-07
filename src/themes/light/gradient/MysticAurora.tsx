import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const mysticAuroraTheme: Theme = {
    ...baseLightTheme,
    id: "mysticAurora",
    name: "Mystic Aurora",
    description: "Magical morning gradients with fresh green highlights.",
    adaptive: false,
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#2B9E84",
        neutral: "#5A4A3A",
        background:
            "linear-gradient(90deg,#FBF8F6 0%,#F5F2EE 40%,#E9F4EA 68%,#7FD1B9 88%,#2B9E84 100%)",
        surface:
            "linear-gradient(90deg,#F2EEE9 0%,#E6EFE9 45%,#CFEAE0 75%,#85CDB6 90%,#2B9E84 100%)",
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
            accent: "#2B9E84",
            muted: "#5A5A5F",
        },
    },
};
