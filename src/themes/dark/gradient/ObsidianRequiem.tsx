import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const obsidianRequiemTheme: Theme = {
    ...baseDarkTheme,
    id: "obsidianRequiem",
    name: "Obsidian Requiem",
    description: "Darkened symphonic deathcore gradients",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#6B58C7",
        neutral: "#9AA0AE",
        background:
            "linear-gradient(180deg,#0D0D10 0%,#0D0D10 50%,#14131C 65%,#1C1A28 78%,#23232C 90%,#2E2740 100%)",
        surface:
            "linear-gradient(180deg,#23232C 0%,#23232C 55%,#2A2A38 70%,#37354A 85%,#57407A 100%)",
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
            accent: "#6B58C7",
            muted: "#9AA0AE",
        },
    },
};
