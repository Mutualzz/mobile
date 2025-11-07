import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const nocturnalAbyssTheme: Theme = {
    ...baseDarkTheme,
    id: "nocturnalAbyss",
    name: "Nocturnal Abyss",
    description: "Deep mysterious tones with cool cyan highlights.",
    adaptive: false,
    type: "dark",
    style: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#63A9C8",
        neutral: "#A5B4C2",
        background: "#0D1113",
        surface: "#1F272C",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#CBD5DD",
            accent: "#63A9C8",
            muted: "#97A9B8",
        },
    },
};
