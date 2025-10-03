import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const gravestoneChillTheme: Theme = {
    ...baseDarkTheme,
    id: "gravestoneChill",
    name: "Gravestone Chill",
    description: "Eerie, muted gradients from the graveyard",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#9A9AAF",
        neutral: "#A5B4C2",
        background: "linear-gradient(135deg, #19171D 0%, #23243A 100%)",
        surface: "linear-gradient(135deg, #23243A 0%, #7A7A8A 100%)",
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
