import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const velvetDreamTheme: Theme = {
    ...baseLightTheme,
    id: "velvetDream",
    name: "Velvet Dream",
    description: "Dramatic, vintage gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#A86A7A",
        neutral: "#B8A8B8",
        background: "linear-gradient(135deg, #F5F4F6 0%, #EDE6EC 100%)",
        surface: "linear-gradient(135deg, #EDE6EC 0%, #A86A7A 100%)",
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
