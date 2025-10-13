import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const floralRadianceTheme: Theme = {
    ...baseLightTheme,
    id: "floralRadiance",
    name: "Floral Radiance",
    description: "Floral, radiant gradients",
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#8A6C36",
        neutral: "#5A5842",
        background:
            "linear-gradient(180deg,#F5F7F3 0%,#F5F7F3 55%,#EFF3EC 72%,#EBF0E8 82%,#E6EDE6 100%)",
        surface:
            "linear-gradient(180deg,#E6EDE6 0%,#E6EDE6 55%,#DBE3D6 70%,#D0D9C8 85%,#A88A5A 100%)",
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
            accent: "#8A6C36",
            muted: "#5A5A5F",
        },
    },
};
