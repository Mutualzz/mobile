import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const velvetLullabyTheme: Theme = {
    ...baseLightTheme,
    id: "velvetLullaby",
    name: "Velvet Lullaby",
    description: "Vintage & Dramatic",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#A86A7A",
        neutral: "#B8A8B8",
        background: "#F5F4F6",
        surface: "#EDE6EC",
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
            accent: "#A86A7A",
            muted: "#B8A8B8",
        },
    },
};
