import type { Theme } from "@emotion/react";
import { baseLightTheme } from "@mutualzz/ui-core";

export const mourningMistTheme: Theme = {
    ...baseLightTheme,
    id: "mourningMist",
    name: "Mourning Mist",
    description: "Misty muted gradients with solemn, soft tones.",
    adaptive: false,
    type: "light",
    style: "gradient",
    colors: {
        ...baseLightTheme.colors,
        primary: "#7A4A4A",
        neutral: "#554848",
        background:
            "linear-gradient(90deg,#FBFBFC 0%,#F5F5F7 40%,#ECE9EE 68%,#A88082 88%,#7A4A4A 100%)",
        surface:
            "linear-gradient(90deg,#F4F2F4 0%,#ECE7EA 45%,#D9C8CA 75%,#B37E80 90%,#7A4A4A 100%)",
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
            accent: "#7A4A4A",
            muted: "#5A5A5F",
        },
    },
};
