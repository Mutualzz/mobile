import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const spectralVeilTheme: Theme = {
    ...baseDarkTheme,
    id: "spectralVeil",
    name: "Spectral Veil",
    description: "Ethereal soft-dark gradients with luminous blue highlights.",
    adaptive: false,
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#6E9EF0",
        neutral: "#A5B4C2",
        background:
            "linear-gradient(90deg,#07080A 0%,#0D1116 45%,#0F1726 70%,#2B3B57 88%,#6E9EF0 100%)",
        surface:
            "linear-gradient(90deg,#161822 0%,#202633 45%,#2A3A4B 72%,#3F5B80 90%,#6E9EF0 100%)",
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
            accent: "#6E9EF0",
            muted: "#97A9B8",
        },
    },
};
