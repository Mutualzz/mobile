import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const mourningMistTheme: Theme = {
    ...baseLightTheme,
    id: "mourningMist",
    name: "Mourning Mist",
    description: "Muted, misty gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#664444",
        neutral: "#554848",
        background:
            "linear-gradient(180deg,#F6F6F7 0%,#F6F6F7 55%,#F1F1F4 72%,#ECECF2 82%,#E6E6EA 100%)",
        surface:
            "linear-gradient(180deg,#E6E6EA 0%,#E6E6EA 55%,#D9D0D2 70%,#C8B6B7 85%,#7A5A5A 100%)",
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
