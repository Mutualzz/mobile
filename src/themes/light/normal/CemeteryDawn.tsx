import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const cemeteryDawnTheme: Theme = {
    ...baseLightTheme,
    id: "cemeteryDawn",
    name: "Cemetery Dawn",
    description: "Muted Morning Mist",
    type: "light",
    colors: {
        ...baseLightTheme.colors,
        primary: "#664444",
        neutral: "#554848",
        background: "#F6F6F7",
        surface: "#E6E6EA",
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
            accent: "#664444",
            muted: "#5A5A5F",
        },
    },
};
