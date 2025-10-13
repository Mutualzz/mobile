import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const vintageSorrowTheme: Theme = {
    ...baseDarkTheme,
    id: "vintageSorrow",
    name: "Vintage Sorrow",
    description: "Dramatic, vintage gradients",
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#D98098",
        neutral: "#D9C0CC",
        background:
            "linear-gradient(180deg,#0D0D10 0%,#0D0D10 55%,#181216 72%,#23181E 82%,#2D1F26 100%)",
        surface:
            "linear-gradient(180deg,#23232A 0%,#23232A 55%,#2B2732 70%,#3A3442 85%,#A86A7A 100%)",
        danger: "#FF6B6B",
        warning: "#F3CE72",
        success: "#5CC8A6",
        info: "#64A9FF",
    },
    typography: {
        ...baseDarkTheme.typography,
        colors: {
            primary: "#F5F5F7",
            secondary: "#EBCDD7",
            accent: "#D98098",
            muted: "#CDAFB9",
        },
    },
};
