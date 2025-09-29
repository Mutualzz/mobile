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
        primary: "#7A7A8A",
        neutral: "#7A8A9A",
        background: "linear-gradient(135deg, #19171D 0%, #23243A 100%)",
        surface: "linear-gradient(135deg, #23243A 0%, #7A7A8A 100%)",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#C2C2C2",
            accent: "#7A7A8A",
            muted: "#7A8A9A",
        },
    },
};
