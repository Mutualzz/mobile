import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const arcaneMidnightTheme: Theme = {
    ...baseDarkTheme,
    id: "arcaneMidnight",
    name: "Arcane Midnight",
    description: "Mystical arcane gradients with rich violet-blue layers.",
    adaptive: false,
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#B884F0",
        neutral: "#C2B5E8",
        background:
            "linear-gradient(90deg,#070608 0%,#0D0D10 45%,#18142A 70%,#4D3A66 88%,#B884F0 100%)",
        surface:
            "linear-gradient(90deg,#19162A 0%,#23203A 45%,#312A52 72%,#56407A 90%,#B884F0 100%)",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#DACFEE",
            accent: "#B884F0",
            muted: "#B7A8D2",
        },
    },
};
