import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const tranquilDepthsTheme: Theme = {
    ...baseLightTheme,
    id: "tranquilDepths",
    name: "Tranquil Depths",
    description: "Calm, oceanic gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#3A5A4A",
        neutral: "#4A5555",
        background:
            "linear-gradient(180deg,#F3F5F4 0%,#F3F5F4 55%,#EEF2F0 72%,#E7EEEC 82%,#E2E6E4 100%)",
        surface:
            "linear-gradient(180deg,#E2E6E4 0%,#E2E6E4 55%,#CBD5D1 70%,#AEBEB8 85%,#3A5A4A 100%)",
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
            accent: "#3A5A4A",
            muted: "#5A5A5F",
        },
    },
};
