import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const tranquilDepthsTheme: Theme = {
    ...baseLightTheme,
    id: "tranquilDepths",
    name: "Tranquil Depths",
    description: "Calm, oceanic gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#3A5A4A",
        neutral: "#7A8A8A",
        background: "linear-gradient(135deg, #F3F5F4 0%, #E2E6E4 100%)",
        surface: "linear-gradient(135deg, #E2E6E4 0%, #3A5A4A 100%)",
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
            accent: "#3A5A4A",
            muted: "#3A3A3A",
        },
    },
};
