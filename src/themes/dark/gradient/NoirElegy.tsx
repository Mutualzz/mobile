import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const noirElegyTheme: Theme = {
    ...baseDarkTheme,
    id: "noirElegy",
    name: "Noir Elegy",
    description: "Melancholic gothic gradients with dusky purple swaths.",
    adaptive: false,
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#B884F0",
        neutral: "#C2B5D8",
        background:
            "linear-gradient(90deg,#070609 0%,#0D0D10 45%,#1B1426 70%,#6B3F7A 88%,#B884F0 100%)",
        surface:
            "linear-gradient(90deg,#16141B 0%,#23232A 45%,#2E2738 72%,#4A3A5A 90%,#B884F0 100%)",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#E1D2F2",
            accent: "#B884F0",
            muted: "#B7A8CC",
        },
    },
};
