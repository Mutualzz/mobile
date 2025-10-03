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
        primary: "#9F6CDA",
        neutral: "#C2B5D8",
        background: "linear-gradient(135deg, #18121D 0%, #23232A 100%)",
        surface: "linear-gradient(135deg, #23232A 0%, #6A4A8A 100%)",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#E1D2F2",
            accent: "#9F6CDA",
            muted: "#B7A8CC",
        },
    },
};
