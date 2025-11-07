import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const gravestoneChillTheme: Theme = {
    ...baseDarkTheme,
    id: "gravestoneChill",
    name: "Gravestone Chill",
    description: "Muted graveyard gradients with chilly stone tones.",
    adaptive: false,
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#B7B7D8",
        neutral: "#A5B4C2",
        background:
            "linear-gradient(90deg,#070708 0%,#0C0D11 45%,#15161C 70%,#3C3E4A 88%,#B7B7D8 100%)",
        surface:
            "linear-gradient(90deg,#15161A 0%,#23243A 45%,#2F3348 72%,#485266 90%,#B7B7D8 100%)",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#D0D6DE",
            accent: "#B7B7D8",
            muted: "#97A9B8",
        },
    },
};
