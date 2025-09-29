import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const vintageSorrowTheme: Theme = {
    ...baseDarkTheme,
    id: "vintageSorrow",
    name: "Vintage Sorrow",
    description: "Dramatic, vintage gradients",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#A86A7A",
        neutral: "#B8A8B8",
        background: "linear-gradient(135deg, #181218 0%, #23232A 100%)",
        surface: "linear-gradient(135deg, #23232A 0%, #A86A7A 100%)",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#C0A5AF",
            accent: "#A86A7A",
            muted: "#B8A8B8",
        },
    },
};
