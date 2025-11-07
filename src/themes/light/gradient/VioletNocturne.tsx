import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const violetNocturneTheme: Theme = {
    ...baseLightTheme,
    id: "violetNocturne",
    name: "Violet Nocturne",
    description: "Gothic violet gradient backgrounds with soft transitions.",
    adaptive: false,
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#5C6FE6",
        neutral: "#4A4F63",
        background:
            "linear-gradient(90deg,#F2F4FB 0%,#E9ECFB 40%,#D0D5F8 68%,#827BEF 88%,#5C6FE6 100%)",
        surface:
            "linear-gradient(90deg,#E9EAF7 0%,#D6D9F6 45%,#B7BFF3 75%,#7E78F0 90%,#5C6FE6 100%)",
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
            accent: "#5C6FE6",
            muted: "#5A5A5F",
        },
    },
};
