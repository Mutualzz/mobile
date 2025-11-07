import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const floralRadianceTheme: Theme = {
    ...baseLightTheme,
    id: "floralRadiance",
    name: "Floral Radiance",
    description: "Floral radiant gradients with warm golden undertones.",
    adaptive: false,
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#C08A2A",
        neutral: "#5A5842",
        background:
            "linear-gradient(90deg,#FBFCF9 0%,#F4F7F2 40%,#EEF5EA 68%,#F0D27A 88%,#C08A2A 100%)",
        surface:
            "linear-gradient(90deg,#F6F7EE 0%,#EAEFD9 45%,#E0D8B4 75%,#D6B56A 90%,#C08A2A 100%)",
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
            accent: "#C08A2A",
            muted: "#5A5A5F",
        },
    },
};
