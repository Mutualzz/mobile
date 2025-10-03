import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const sereneHorizonTheme: Theme = {
    ...baseLightTheme,
    id: "sereneHorizon",
    name: "Serene Horizon",
    description: "Uplifting, hopeful gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#3F6070",
        neutral: "#4A5360",
        background: "linear-gradient(135deg, #F4F6F8 0%, #E6EAEE 100%)",
        surface: "linear-gradient(135deg, #E6EAEE 0%, #5A7C8A 100%)",
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
            accent: "#3F6070",
            muted: "#5A5A5F",
        },
    },
};
