import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const arcaneMidnightTheme: Theme = {
    ...baseDarkTheme,
    id: "arcaneMidnight",
    name: "Arcane Midnight",
    description: "Mystical, arcane gradients",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#6A4A8A",
        neutral: "#8A7CA8",
        background: "linear-gradient(135deg, #18162A 0%, #23203A 100%)",
        surface: "linear-gradient(135deg, #23203A 0%, #6A4A8A 100%)",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#B8B8D0",
            accent: "#6A4A8A",
            muted: "#8A7CA8",
        },
    },
};
