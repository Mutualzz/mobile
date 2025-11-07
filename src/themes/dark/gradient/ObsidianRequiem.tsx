import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const obsidianRequiemTheme: Theme = {
    ...baseDarkTheme,
    id: "obsidianRequiem",
    name: "Obsidian Requiem",
    description: "Intense obsidian gradients with brooding violet undertones.",
    adaptive: false,
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#8365E2",
        neutral: "#9AA0AE",
        background:
            "linear-gradient(90deg,#070608 0%,#0C0B10 45%,#16121F 65%,#2B2540 80%,#8365E2 100%)",
        surface:
            "linear-gradient(90deg,#16141A 0%,#23232C 45%,#2C2A38 72%,#4A3962 90%,#8365E2 100%)",
        danger: "#E04B5A",
        warning: "#D1A24A",
        success: "#4FAF7A",
        info: "#4A78D8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#C7C9D2",
            accent: "#8365E2",
            muted: "#9AA0AE",
        },
    },
};
