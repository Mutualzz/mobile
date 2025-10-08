import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const spectralVeilTheme: Theme = {
    ...baseDarkTheme,
    id: "spectralVeil",
    name: "Spectral Veil",
    description: "Ethereal, softly dark gradients",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#87A8E8",
        neutral: "#A5B4C2",
        background:
            "linear-gradient(180deg,#0D0D10 0%,#0D0D10 55%,#141923 72%,#1B2530 82%,#233040 100%)",
        surface:
            "linear-gradient(180deg,#23232A 0%,#23232A 55%,#2A313A 70%,#36465A 85%,#6A7CA8 100%)",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#CBD5E8",
            accent: "#87A8E8",
            muted: "#97A9B8",
        },
    },
};
