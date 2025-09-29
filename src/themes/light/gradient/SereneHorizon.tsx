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
        primary: "#5A7C8A",
        neutral: "#7A8A9A",
        background: "linear-gradient(135deg, #F4F6F8 0%, #E6EAEE 100%)",
        surface: "linear-gradient(135deg, #E6EAEE 0%, #5A7C8A 100%)",
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
            accent: "#5A7C8A",
            muted: "#3A4A5A",
        },
    },
};
