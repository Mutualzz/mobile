import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const rustAuroraTheme: Theme = {
    ...baseLightTheme,
    id: "rustAurora",
    name: "Rust Aurora",
    description: "Warm industrial gradients with sunlit rust layers.",
    adaptive: false,
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#A76B3C",
        neutral: "#5A5142",
        background:
            "linear-gradient(90deg,#FBF7F5 0%,#F5EEE9 38%,#ECD7C8 65%,#C6744A 88%,#A76B3C 100%)",
        surface:
            "linear-gradient(90deg,#F1E9E5 0%,#E6D9D1 45%,#D2B9A8 75%,#C07752 90%,#A76B3C 100%)",
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
            accent: "#A76B3C",
            muted: "#5A5A5F",
        },
    },
};
