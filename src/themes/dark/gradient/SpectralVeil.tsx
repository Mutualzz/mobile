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
        primary: "#6A7CA8",
        neutral: "#7A8A9A",
        background: "linear-gradient(135deg, #191919 0%, #23232A 100%)",
        surface: "linear-gradient(135deg, #23232A 0%, #6A7CA8 100%)",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#B5B5B5",
            accent: "#6A7CA8",
            muted: "#7A8A9A",
        },
    },
};
