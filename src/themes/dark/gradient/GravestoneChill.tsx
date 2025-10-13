import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const gravestoneChillTheme: Theme = {
    ...baseDarkTheme,
    id: "gravestoneChill",
    name: "Gravestone Chill",
    description: "Eerie, muted gradients from the graveyard",
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#9A9AAF",
        neutral: "#A5B4C2",
        background:
            "linear-gradient(180deg,#0D0D10 0%,#0D0D10 55%,#14141A 72%,#1C1C24 82%,#24242E 100%)",
        surface:
            "linear-gradient(180deg,#23243A 0%,#23243A 55%,#2B2E48 70%,#3A4256 85%,#7A7A8A 100%)",
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
            accent: "#9A9AAF",
            muted: "#97A9B8",
        },
    },
};
