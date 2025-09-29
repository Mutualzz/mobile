import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const etherealWhisperTheme: Theme = {
    ...baseLightTheme,
    id: "etherealWhisper",
    name: "Ethereal Whisper",
    description: "Eerie, ethereal gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#7CA8A6",
        neutral: "#A8C0C0",
        background: "linear-gradient(135deg, #F4F7F6 0%, #E6EEEC 100%)",
        surface: "linear-gradient(135deg, #E6EEEC 0%, #7CA8A6 100%)",
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
            accent: "#6A6A8A",
            muted: "#3A3A4A",
        },
    },
};
