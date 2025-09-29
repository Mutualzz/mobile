import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const mourningMistTheme: Theme = {
    ...baseLightTheme,
    id: "mourningMist",
    name: "Mourning Mist",
    description: "Muted, misty gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#7A5A5A",
        neutral: "#8A7A7A",
        background: "linear-gradient(135deg, #F6F6F7 0%, #E6E6EA 100%)",
        surface: "linear-gradient(135deg, #E6E6EA 0%, #7A5A5A 100%)",
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
            accent: "#7A5A5A",
            muted: "#4A3A3A",
        },
    },
};
