import type { Theme } from "@emotion/react";
import { baseDarkTheme } from "@mutualzz/ui-core";

export const vintageSorrowTheme: Theme = {
    ...baseDarkTheme,
    id: "vintageSorrow",
    name: "Vintage Sorrow",
    description:
        "Dramatic vintage gradients with melancholic rose transitions.",
    adaptive: false,
    type: "dark",
    style: "gradient",
    colors: {
        ...baseDarkTheme.colors,
        primary: "#FF95AB",
        neutral: "#D9C0CC",
        background:
            "linear-gradient(90deg,#070609 0%,#0F0D11 45%,#2A1720 70%,#8B4B5A 90%,#FF95AB 100%)",
        surface:
            "linear-gradient(90deg,#19161A 0%,#20161A 45%,#3C2430 72%,#7A4B57 90%,#FF95AB 100%)",
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
            accent: "#FF95AB",
            muted: "#CDAFB9",
        },
    },
};
