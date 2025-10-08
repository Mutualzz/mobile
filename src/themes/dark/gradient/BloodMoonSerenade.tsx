import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const bloodMoonSerenadeTheme: Theme = {
    ...baseDarkTheme,
    id: "bloodMoonSerenade",
    name: "Blood Moon Serenade",
    description: "Crimson gradients of romance and tragedy",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#E1556B",
        neutral: "#C7AFC0",
        background:
            "linear-gradient(180deg,#0D0D10 0%,#0D0D10 55%,#1A1114 72%,#24171C 82%,#301E24 100%)",
        surface:
            "linear-gradient(180deg,#23141A 0%,#23141A 55%,#2B1A22 70%,#3C2631 85%,#A23A4F 100%)",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#F0C8CF",
            accent: "#E1556B",
            muted: "#BFA8B4",
        },
    },
};
