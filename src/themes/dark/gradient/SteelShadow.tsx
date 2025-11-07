import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const steelShadowTheme: Theme = {
    ...baseDarkTheme,
    id: "steelShadow",
    name: "Steel Shadow",
    description: "Sharp dystopian gradients with cold steel blues.",
    adaptive: false,
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#98A0D6",
        neutral: "#B0B0B8",
        background:
            "linear-gradient(90deg,#07080A 0%,#0F1115 45%,#111423 70%,#354A66 88%,#98A0D6 100%)",
        surface:
            "linear-gradient(90deg,#1C2232 0%,#23283A 45%,#2E3350 72%,#445273 90%,#98A0D6 100%)",
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
            accent: "#98A0D6",
            muted: "#A0A0AA",
        },
    },
};
