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
        primary: "#A23A4F",
        neutral: "#A88A9A",
        background: "linear-gradient(135deg, #18161A 0%, #23141A 100%)",
        surface: "linear-gradient(135deg, #23141A 0%, #A23A4F 100%)",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#E0B0B0",
            accent: "#A23A4F",
            muted: "#A88A9A",
        },
    },
};
