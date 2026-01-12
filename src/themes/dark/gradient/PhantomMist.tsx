import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const phantomMistTheme: Theme = {
    ...baseDarkTheme,
    id: "phantomMist",
    name: "Phantom Mist",
    description: "Ethereal misty gradients with deep ocean shadows.",
    adaptive: false,
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#4BB7D9",
        neutral: "#A5B4C2",
        background:
            "linear-gradient(180deg,#070709 0%,#0D1113 45%,#0E1C21 75%,#255A71 100%,#4BB7D9 100%)",
        surface:
            "linear-gradient(180deg,#15181B 0%,#20272A 45%,#2B3638 75%,#3F5560 100%,#4BB7D9 100%)",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#C9D8E0",
            accent: "#4BB7D9",
            muted: "#97A9B8",
        },
    },
};
