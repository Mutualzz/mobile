import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const forestNightTheme: Theme = {
    ...baseDarkTheme,
    id: "forestNight",
    name: "Forest Night",
    description:
        "Deep woodland hush with mossy greens and moonlit canopy shadows.",
    adaptive: false,
    type: "dark",
    style: "normal",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#6BCB8A",
        neutral: "#8FAE9A",
        background: "#0C1410",
        surface: "#16241C",
        danger: "#FF6B6B",
        warning: "#E8C06A",
        success: "#6BCB8A",
        info: "#5AB8A0",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#EAF5EE",
            secondary: "#B8D4C4",
            accent: "#6BCB8A",
            muted: "#7A9A88",
        },
    },
};
