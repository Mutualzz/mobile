import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const crimsonLamentTheme: Theme = {
    ...baseDarkTheme,
    id: "crimsonLament",
    name: "Crimson Lament",
    description: "Dark romantic crimson tones with somber undertones.",
    adaptive: false,
    type: "dark",
    style: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#E1556B",
        neutral: "#C7AFC0",
        background: "#100E11",
        surface: "#27171C",
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
