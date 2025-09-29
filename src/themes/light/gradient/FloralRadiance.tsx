import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const floralRadianceTheme: Theme = {
    ...baseLightTheme,
    id: "floralRadiance",
    name: "Floral Radiance",
    description: "Floral, radiant gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#A88A5A",
        neutral: "#A8A87A",
        background: "linear-gradient(135deg, #F5F7F3 0%, #E6EDE6 100%)",
        surface: "linear-gradient(135deg, #E6EDE6 0%, #A88A5A 100%)",
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
            accent: "#A88A5A",
            muted: "#5A4A3A",
        },
    },
};
