import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const velvetDreamTheme: Theme = {
    ...baseLightTheme,
    id: "velvetDream",
    name: "Velvet Dream",
    description: "Dramatic vintage gradients with rich violet-to-rose fades.",
    adaptive: false,
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#B25574",
        neutral: "#5A4652",
        background:
            "linear-gradient(90deg,#F7F5F7 0%,#F1EDF3 38%,#E3D2E2 65%,#C26B89 88%,#B25574 100%)",
        surface:
            "linear-gradient(90deg,#F0E9EE 0%,#E6DAE4 45%,#D0B2C5 75%,#B86F88 92%,#B25574 100%)",
        danger: "#B3261E",
        warning: "#8F6500",
        success: "#1F6E34",
        info: "#0F5DA8",
    },
    typography: {
        ...baseLightTheme.typography,
        colors: {
            primary: "#1A1A1A",
            secondary: "#3A3A3A",
            accent: "#B25574",
            muted: "#5A5A5F",
        },
    },
};
