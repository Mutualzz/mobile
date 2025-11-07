import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const tranquilDepthsTheme: Theme = {
    ...baseLightTheme,
    id: "tranquilDepths",
    name: "Tranquil Depths",
    description: "Calm oceanic gradients with layered sea tones.",
    adaptive: false,
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#2F8B72",
        neutral: "#4A5555",
        background:
            "linear-gradient(90deg,#F5FAF9 0%,#EAF4F2 40%,#CFE9E5 68%,#67B49B 88%,#2F8B72 100%)",
        surface:
            "linear-gradient(90deg,#E9F4F1 0%,#D3ECE7 45%,#B2E0D6 75%,#6FB99F 90%,#2F8B72 100%)",
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
            accent: "#2F8B72",
            muted: "#5A5A5F",
        },
    },
};
