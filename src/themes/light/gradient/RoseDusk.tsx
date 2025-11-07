import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const roseDuskTheme: Theme = {
    ...baseLightTheme,
    id: "roseDusk",
    name: "Rose Dusk",
    description: "Romantic soft gradients shifting from blush to deep rose.",
    adaptive: false,
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#C14A63",
        neutral: "#5A4652",
        background:
            "linear-gradient(90deg,#F9F6F7 0%,#F3EDF0 40%,#F0D6DE 68%,#E37586 88%,#C14A63 100%)",
        surface:
            "linear-gradient(90deg,#F2EBEE 0%,#EAD7DB 45%,#DFB7C2 75%,#D36A7D 90%,#C14A63 100%)",
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
            accent: "#C14A63",
            muted: "#5A5A5F",
        },
    },
};
