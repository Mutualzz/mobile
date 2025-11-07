import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const silverDawnTheme: Theme = {
    ...baseLightTheme,
    id: "silverDawn",
    name: "Silver Dawn",
    description: "Cool metallic gradients evoking early morning steel.",
    adaptive: false,
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#5B8E6F",
        neutral: "#555555",
        background:
            "linear-gradient(90deg,#F4F7F8 0%,#EAF0F2 40%,#D8E6E6 68%,#86B39E 88%,#5B8E6F 100%)",
        surface:
            "linear-gradient(90deg,#EEF3F3 0%,#DCE9E7 45%,#B6D6CB 75%,#86B39E 90%,#5B8E6F 100%)",
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
            accent: "#5B8E6F",
            muted: "#5A5A5F",
        },
    },
};
