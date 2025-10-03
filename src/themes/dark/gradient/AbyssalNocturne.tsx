import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const abyssalNocturneTheme: Theme = {
    ...baseDarkTheme,
    id: "abyssalNocturne",
    name: "Abyssal Nocturne",
    description: "Deep, mysterious gradients",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#63A9C8",
        neutral: "#A5B4C2",
        background: "linear-gradient(135deg, #151515 0%, #23232A 100%)",
        surface: "linear-gradient(135deg, #23232A 0%, #5A7C8A 100%)",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#CBD5DD",
            accent: "#63A9C8",
            muted: "#97A9B8",
        },
    },
};
