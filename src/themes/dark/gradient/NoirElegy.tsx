import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const noirElegyTheme: Theme = {
    ...baseDarkTheme,
    id: "noirElegy",
    name: "Noir Elegy",
    description: "Melancholic gothic gradients",
    type: "dark",
    mode: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#6A4A8A",
        neutral: "#8A7CA8",
        background: "linear-gradient(135deg, #18121D 0%, #23232A 100%)",
        surface: "linear-gradient(135deg, #23232A 0%, #6A4A8A 100%)",
        danger: "#B85C5C",
        warning: "#E6C463",
        success: "#5CA88A",
        info: "#5C7FA8",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F4F4F4",
            secondary: "#CAB8D8",
            accent: "#6A4A8A",
            muted: "#8A7CA8",
        },
    },
};
