import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const forestDayGradientTheme: Theme = {
    ...baseLightTheme,
    id: "forestDayGradient",
    name: "Forest Day",
    description:
        "Sunlit leaf gradients washing from misty clearing into fresh canopy green.",
    adaptive: false,
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#2F8F5B",
        neutral: "#6B8F7A",
        background:
            "linear-gradient(180deg,#F7FBF8 0%,#EEF6F0 40%,#D8ECDF 75%,#8FCBAA 100%)",
        surface:
            "linear-gradient(180deg,#EEF6F0 0%,#D8ECDF 40%,#B5DCC4 75%,#2F8F5B 100%)",
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
