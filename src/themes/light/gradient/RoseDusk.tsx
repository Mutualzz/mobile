import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const roseDuskTheme: Theme = {
    ...baseLightTheme,
    id: "roseDusk",
    name: "Rose Dusk",
    description: "Romantic, soft gradients",
    type: "light",
    mode: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#A23A4F",
        neutral: "#5A4652",
        background:
            "linear-gradient(180deg,#F6F4F6 0%,#F6F4F6 55%,#F2EEF3 72%,#EDE8EE 82%,#EDE6EC 100%)",
        surface:
            "linear-gradient(180deg,#EDE6EC 0%,#EDE6EC 55%,#E0CED6 70%,#D7BCC6 85%,#A23A4F 100%)",
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
            accent: "#A23A4F",
            muted: "#5A5A5F",
        },
    },
};
