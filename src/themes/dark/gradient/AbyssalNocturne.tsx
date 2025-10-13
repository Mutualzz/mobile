import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const abyssalNocturneTheme: Theme = {
    ...baseDarkTheme,
    id: "abyssalNocturne",
    name: "Abyssal Nocturne",
    description: "Deep, mysterious gradients",
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#63A9C8",
        neutral: "#A5B4C2",
        background:
            "linear-gradient(180deg,#0D0D10 0%,#0D0D10 55%,#112229 72%,#16323C 82%,#1D3E4B 100%)",
        surface:
            "linear-gradient(180deg,#23232A 0%,#23232A 55%,#2B3640 70%,#36505C 85%,#5A7C8A 100%)",
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
