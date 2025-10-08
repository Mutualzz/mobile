import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const rustRequiemTheme: Theme = {
    ...baseDarkTheme,
    id: "rustRequiem",
    name: "Rust Requiem",
    description: "Grunge & industrial gradients",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#D09663",
        neutral: "#C4B48F",
        background:
            "linear-gradient(180deg,#0D0D10 0%,#0D0D10 55%,#181410 72%,#221B14 82%,#2C241A 100%)",
        surface:
            "linear-gradient(180deg,#23241A 0%,#23241A 55%,#2B2E22 70%,#3A3C2C 85%,#A87C5A 100%)",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#E1D3C0",
            accent: "#D09663",
            muted: "#B8AB88",
        },
    },
};
