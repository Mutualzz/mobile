import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const eternalMourningTheme: Theme = {
    ...baseDarkTheme,
    id: "eternalMourning",
    name: "Eternal Mourning",
    description: "Melancholic & Gothic Elegance",
    type: "dark",
    mode: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#6A4A8A",
        neutral: "#8A7CA8",
        background: "#18121D",
        surface: "#23232A",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#CAB8D8",
            accent: "#6A4A8A",
            muted: "#8A7CA8",
        },
    },
};
