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
        primary: "#4A7D79",
        neutral: "#4A5E5E",
        background: "linear-gradient(135deg, #F4F7F6 0%, #E6EEEC 100%)",
        surface: "linear-gradient(135deg, #E6EEEC 0%, #7CA8A6 100%)",
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
            accent: "#4A7D79",
            muted: "#5A5A5F",
        },
    },
};
