import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const arcaneSunriseTheme: Theme = {
    ...baseLightTheme,
    id: "arcaneSunrise",
    name: "Arcane Sunrise",
    description: "Mystical Morning Glow",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#3A7C6A",
        neutral: "#7A6A5A",
        background: "#F7F5F3",
        surface: "#EDE9E6",
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
            accent: "#3A7C6A",
            muted: "#3A4A5A",
        },
    },
};
