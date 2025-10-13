import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const mysticAuroraTheme: Theme = {
    ...baseLightTheme,
    id: "mysticAurora",
    name: "Mystic Aurora",
    description: "Magical morning gradients",
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#3A7C6A",
        neutral: "#5A4A3A",
        background:
            "linear-gradient(180deg,#F7F5F3 0%,#F7F5F3 55%,#F3F0EB 72%,#EFEAE6 82%,#EDE9E6 100%)",
        surface:
            "linear-gradient(180deg,#EDE9E6 0%,#EDE9E6 55%,#D6E2DB 70%,#B6D0C5 85%,#3A7C6A 100%)",
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
            accent: "#3A7C6A",
            muted: "#5A5A5F",
        },
    },
};
