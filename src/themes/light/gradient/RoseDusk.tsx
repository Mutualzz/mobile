import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const roseDuskTheme: Theme = {
    ...baseLightTheme,
    id: "roseDusk",
    name: "Rose Dusk",
    description: "Romantic, soft gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#A23A4F",
        neutral: "#A88A9A",
        background: "linear-gradient(135deg, #F6F4F6 0%, #EDE6EC 100%)",
        surface: "linear-gradient(135deg, #EDE6EC 0%, #A23A4F 100%)",
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
            accent: "#A23A4F",
            muted: "#A88A9A",
        },
    },
};
