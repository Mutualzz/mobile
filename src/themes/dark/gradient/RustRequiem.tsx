import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const rustRequiemTheme: Theme = {
    ...baseDarkTheme,
    id: "rustRequiem",
    name: "Rust Requiem",
    description: "Grunge industrial gradients with warm oxidized layers.",
    adaptive: false,
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#FFB37A",
        neutral: "#C4B48F",
        background:
            "linear-gradient(90deg,#070605 0%,#0D0D0B 45%,#241B14 70%,#905E3F 88%,#FFB37A 100%)",
        surface:
            "linear-gradient(90deg,#15140F 0%,#201E18 45%,#2E2A23 72%,#6F4E3D 90%,#FFB37A 100%)",
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
            accent: "#FFB37A",
            muted: "#B8AB88",
        },
    },
};
