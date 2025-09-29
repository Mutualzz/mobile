import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const phantomMistTheme: Theme = {
    ...baseDarkTheme,
    id: "phantomMist",
    name: "Phantom Mist",
    description: "Ethereal gradients of despair",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#5A7C8A",
        neutral: "#7A8A9A",
        background: "linear-gradient(135deg, #181A1D 0%, #23232A 100%)",
        surface: "linear-gradient(135deg, #23232A 0%, #5A7C8A 100%)",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#BFD0D9",
            accent: "#5A7C8A",
            muted: "#7A8A9A",
        },
    },
};
