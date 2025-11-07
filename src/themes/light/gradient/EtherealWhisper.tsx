import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const etherealWhisperTheme: Theme = {
    ...baseLightTheme,
    id: "etherealWhisper",
    name: "Ethereal Whisper",
    description: "Ethereal gradients with delicate aqua and misty whites.",
    adaptive: false,
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#2AA8A3",
        neutral: "#4A5E5E",
        background:
            "linear-gradient(90deg,#F0FBFA 0%,#DFF7F5 40%,#AEEBE7 68%,#56C2BD 88%,#2AA8A3 100%)",
        surface:
            "linear-gradient(90deg,#E9F9F8 0%,#CDF3F1 45%,#9BE6E2 75%,#58C1BD 90%,#2AA8A3 100%)",
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
            accent: "#2AA8A3",
            muted: "#5A5A5F",
        },
    },
};
