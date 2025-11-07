import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const bloodMoonSerenadeTheme: Theme = {
    ...baseDarkTheme,
    id: "bloodMoonSerenade",
    name: "Blood Moon Serenade",
    description: "Crimson gradients blending romance and tragic dusk.",
    adaptive: false,
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#FF6F84",
        neutral: "#C7AFC0",
        background:
            "linear-gradient(90deg,#070608 0%,#0D0D10 45%,#160F12 70%,#8B2F3C 88%,#FF6F84 100%)",
        surface:
            "linear-gradient(90deg,#140F12 0%,#24171C 45%,#312126 72%,#7A3945 90%,#FF6F84 100%)",
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
            accent: "#FF6F84",
            muted: "#BFA8B4",
        },
    },
};
