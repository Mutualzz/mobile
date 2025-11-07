import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const abyssalNocturneTheme: Theme = {
    ...baseDarkTheme,
    id: "abyssalNocturne",
    name: "Abyssal Nocturne",
    description: "Deep mysterious gradients with oceanic indigo hues.",
    adaptive: false,
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#2EA8D8",
        neutral: "#A5B4C2",
        background:
            "linear-gradient(90deg,#07080A 0%,#0D1115 45%,#081F2B 70%,#135269 88%,#2EA8D8 100%)",
        surface:
            "linear-gradient(90deg,#15171A 0%,#23232A 45%,#2B3942 72%,#2E5160 90%,#2EA8D8 100%)",
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
            accent: "#2EA8D8",
            muted: "#97A9B8",
        },
    },
};
