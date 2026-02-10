import {
    baseDarkTheme,
    baseLightTheme,
    extractColors,
    formatColor,
    isValidGradient,
    randomHexColor,
    type ColorLike,
} from "@mutualzz/ui-core";
import chroma from "chroma-js";
import { Appearance } from "react-native";

interface AdaptColors {
    baseColor: ColorLike;
    primaryColor: ColorLike;
    primaryText: ColorLike;
}

const ensureContrast = (bg: chroma.Color, fg: chroma.Color, minRatio = 4.5) => {
    let lighten = bg;
    let darken = bg;
    let lightenSteps = 0;
    let darkenSteps = 0;
    const stepAmount = 0.03;

    // Try lightening
    while (chroma.contrast(lighten, fg) < minRatio && lightenSteps < 40) {
        lighten = lighten.brighten(stepAmount);
        lightenSteps++;
    }
    // Try darkening
    while (chroma.contrast(darken, fg) < minRatio && darkenSteps < 40) {
        darken = darken.darken(stepAmount);
        darkenSteps++;
    }
    // Pick the one with the least steps (least color distortion)
    return lightenSteps < darkenSteps ? lighten.hex() : darken.hex();
};

function blendSemantic(baseHex: string, themeBase: chroma.Color) {
    return chroma
        .mix(baseHex, themeBase, 0.4, "lab")
        .saturate(1)
        .set("hsl.l", 0.6);
}

function averageColors(colors: string[]): chroma.Color {
    if (colors.length === 1) return chroma(colors[0]);
    let avg = chroma(colors[0]);
    for (let i = 1; i < colors.length; i++) {
        avg = chroma.mix(avg, colors[i], 1 / (i + 1));
    }
    return avg;
}

export const adaptColors = ({
    baseColor,
    primaryColor,
    primaryText,
}: AdaptColors) => {
    const prefersDark = Appearance.getColorScheme() === "dark";
    const gradientColors = isValidGradient(baseColor)
        ? (extractColors(baseColor) ?? [randomHexColor()])
        : [baseColor];

    const SEMANTIC_BASES = prefersDark
        ? {
              danger: baseDarkTheme.colors.danger,
              info: baseDarkTheme.colors.info,
              success: baseDarkTheme.colors.success,
              warning: baseDarkTheme.colors.warning,
          }
        : {
              danger: baseLightTheme.colors.danger,
              info: baseLightTheme.colors.info,
              success: baseLightTheme.colors.success,
              warning: baseLightTheme.colors.warning,
          };

    const base = averageColors(gradientColors);

    const primary = chroma(primaryColor);
    const text = chroma(primaryText);

    const background = baseColor;

    const surface = formatColor(baseColor, {
        lighten: prefersDark ? 10 : 50,
    });

    const surfaceColors = gradientColors.map((c) =>
        formatColor(c, { lighten: prefersDark ? 10 : 50 }),
    );
    const surfaceBase = averageColors(surfaceColors);

    // Adaptive neutral lightness based on theme
    const neutralBase = chroma.mix(base, surfaceBase, 0.5);
    const neutralLightness = prefersDark ? 0.85 : 0.25;
    const neutral = neutralBase
        .desaturate(5)
        .set("hsl.l", neutralLightness)
        .hex();

    // Typography
    const typographyPrimary = ensureContrast(text, base, 4.5);
    const typographySecondary = ensureContrast(text.brighten(0.5), base, 3.5);
    const typographyAccent = ensureContrast(primary, base, 4.5);
    const typographyMuted = chroma(ensureContrast(text.desaturate(2), base, 3))
        .alpha(0.7)
        .hex();

    const danger = ensureContrast(
        blendSemantic(SEMANTIC_BASES.danger, base),
        text,
    );
    const success = ensureContrast(
        blendSemantic(SEMANTIC_BASES.success, base),
        text,
    );
    const info = ensureContrast(blendSemantic(SEMANTIC_BASES.info, base), text);
    const warning = ensureContrast(
        blendSemantic(SEMANTIC_BASES.warning, base),
        text,
    );

    return {
        colors: {
            common: {
                white: "#FFFFFF",
                black: "#000000",
            },
            primary: primary.hex(),
            neutral,
            background,
            surface,
            danger,
            info,
            success,
            warning,
        },
        typography: {
            colors: {
                primary: typographyPrimary,
                secondary: typographySecondary,
                accent: typographyAccent,
                muted: typographyMuted,
            },
        },
    };
};
