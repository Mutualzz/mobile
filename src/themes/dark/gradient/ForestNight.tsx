import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const forestNightGradientTheme: Theme = {
    ...baseDarkTheme,
    id: "forestNightGradient",
    name: "Forest Night",
    description:
        "Moonlit canopy gradients drifting through deep moss and pine shadow.",
    adaptive: false,
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#6BCB8A",
        neutral: "#8FAE9A",
        background:
            "linear-gradient(180deg,#070C09 0%,#0C1410 40%,#16241C 75%,#1E3A2A 100%)",
        surface:
            "linear-gradient(180deg,#122018 0%,#1A2E22 40%,#244A34 75%,#6BCB8A 100%)",
        danger: "#FF6B6B",
        warning: "#E8C06A",
        success: "#6BCB8A",
        info: "#5AB8A0",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#EAF5EE",
            secondary: "#B8D4C4",
            accent: "#6BCB8A",
            muted: "#7A9A88",
        },
    },
};
