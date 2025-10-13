import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const noirElegyTheme: Theme = {
    ...baseDarkTheme,
    id: "noirElegy",
    name: "Noir Elegy",
    description: "Melancholic gothic gradients",
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#9F6CDA",
        neutral: "#C2B5D8",
        background:
            "linear-gradient(180deg,#0D0D10 0%,#0D0D10 55%,#161322 72%,#201B32 82%,#2A2540 100%)",
        surface:
            "linear-gradient(180deg,#23232A 0%,#23232A 55%,#2B2734 70%,#3A3148 85%,#6A4A8A 100%)",
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
            accent: "#9F6CDA",
            muted: "#B7A8CC",
        },
    },
};
