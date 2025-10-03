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
        background: "linear-gradient(135deg, #18161A 0%, #23141A 100%)",
        surface: "linear-gradient(135deg, #23141A 0%, #A23A4F 100%)",
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
