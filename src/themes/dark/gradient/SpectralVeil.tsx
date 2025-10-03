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
        background: "linear-gradient(135deg, #191919 0%, #23232A 100%)",
        surface: "linear-gradient(135deg, #23232A 0%, #6A7CA8 100%)",
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
