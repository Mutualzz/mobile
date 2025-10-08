import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const steelShadowTheme: Theme = {
    ...baseDarkTheme,
    id: "steelShadow",
    name: "Steel Shadow",
    description: "Dystopian, sharp gradients",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#7F82B0",
        neutral: "#B0B0B8",
        background:
            "linear-gradient(180deg,#0D0D10 0%,#0D0D10 55%,#14161E 72%,#1B212C 82%,#243042 100%)",
        surface:
            "linear-gradient(180deg,#23243A 0%,#23243A 55%,#2B3048 70%,#3A3F5A 85%,#5A5A7A 100%)",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#D0D0D4",
            accent: "#7F82B0",
            muted: "#A0A0AA",
        },
    },
};
