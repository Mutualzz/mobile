import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const arcaneMidnightTheme: Theme = {
    ...baseDarkTheme,
    id: "arcaneMidnight",
    name: "Arcane Midnight",
    description: "Mystical, arcane gradients",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#9F6CDA",
        neutral: "#C2B5E8",
        background:
            "linear-gradient(180deg,#0D0D10 0%,#0D0D10 55%,#17142A 72%,#211C3A 82%,#2A2548 100%)",
        surface:
            "linear-gradient(180deg,#23203A 0%,#23203A 55%,#2C2748 70%,#3A3360 85%,#6A4A8A 100%)",
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
            accent: "#9F6CDA",
            muted: "#B7A8D2",
        },
    },
};
