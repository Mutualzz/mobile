import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const mistOfHopeTheme: Theme = {
    ...baseLightTheme,
    id: "mistOfHope",
    name: "Mist of Hope",
    description: "Soft & Uplifting",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#5A7C8A",
        neutral: "#7A8A9A",
        background: "#F4F6F8",
        surface: "#E6EAEE",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseLightTheme.typography,
        colors: {
            primary: "#222222",
            secondary: "#333333",
            accent: "#5A7C8A",
            muted: "#3A4A5A",
        },
    },
};
