import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const rustRequiemTheme: Theme = {
    ...baseDarkTheme,
    id: "rustRequiem",
    name: "Rust Requiem",
    description: "Grunge & industrial gradients",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#A87C5A",
        neutral: "#A89A7A",
        background: "linear-gradient(135deg, #19171A 0%, #23241A 100%)",
        surface: "linear-gradient(135deg, #23241A 0%, #A87C5A 100%)",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#C5B6AA",
            accent: "#A87C5A",
            muted: "#A89A7A",
        },
    },
};
