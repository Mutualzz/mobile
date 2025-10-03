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
        primary: "#914F60",
        neutral: "#5A4652",
        background: "linear-gradient(135deg, #F5F4F6 0%, #EDE6EC 100%)",
        surface: "linear-gradient(135deg, #EDE6EC 0%, #914F60 100%)",
        danger: "#B3261E",
        warning: "#8F6500",
        success: "#1F6E34",
        info: "#0F5DA8",
    },
    typography: {
        ...baseLightTheme.typography,
        colors: {
            primary: "#1A1A1A",
            secondary: "#3A3A3A",
            accent: "#914F60",
            muted: "#5A5A5F",
        },
    },
};
