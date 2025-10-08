import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const phantomMistTheme: Theme = {
    ...baseDarkTheme,
    id: "phantomMist",
    name: "Phantom Mist",
    description: "Ethereal gradients of despair",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#63A9C8",
        neutral: "#A5B4C2",
        background:
            "linear-gradient(180deg,#0D0D10 0%,#0D0D10 55%,#121A1F 72%,#18252C 82%,#20303A 100%)",
        surface:
            "linear-gradient(180deg,#23232A 0%,#23232A 55%,#2A3138 70%,#364754 85%,#5A7C8A 100%)",
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
            accent: "#63A9C8",
            muted: "#97A9B8",
        },
    },
};
