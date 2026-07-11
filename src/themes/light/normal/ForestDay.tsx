import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const forestDayTheme: Theme = {
    ...baseLightTheme,
    id: "forestDay",
    name: "Forest Day",
    description:
        "Sun-dappled glade with fresh leaf greens and soft morning mist.",
    adaptive: false,
    type: "light",
    style: "normal",
    colors: {
        ...baseLightTheme.colors,
        primary: "#2F8F5B",
        neutral: "#6B8F7A",
        background: "#F3F8F4",
        surface: "#E6F0E9",
        danger: "#B3261E",
        warning: "#A66A12",
        success: "#2F8F5B",
        info: "#3A9B7A",
    },
    typography: {
        ...baseLightTheme.typography,
        colors: {
            primary: "#142018",
            secondary: "#2E4036",
            accent: "#2F8F5B",
            muted: "#5A7264",
        },
    },
};
