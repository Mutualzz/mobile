import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const sereneHorizonTheme: Theme = {
    ...baseLightTheme,
    id: "sereneHorizon",
    name: "Serene Horizon",
    description: "Uplifting gradients blending soft sky blues and grays.",
    adaptive: false,
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#4A90B0",
        neutral: "#4A5360",
        background:
            "linear-gradient(90deg,#F6FAFB 0%,#EEF5F8 40%,#DDEFF4 68%,#8CC0DA 88%,#4A90B0 100%)",
        surface:
            "linear-gradient(90deg,#EEF6F9 0%,#DDEFF4 45%,#B7DFEE 75%,#8CC0DA 90%,#4A90B0 100%)",
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
            accent: "#4A90B0",
            muted: "#5A5A5F",
        },
    },
};
