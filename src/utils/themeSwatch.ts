import Color from "color";
import {
    extractColors,
    extractGradientInfo,
    formatColor,
    isValidGradient,
    type ColorLike,
} from "@mutualzz/ui-core";

export type ThemeSwatchStop = {
    color: string;
    widthPercent: number;
};

const normalizeColor = (color: ColorLike): string => {
    try {
        if (typeof color === "string" && isValidGradient(color)) {
            const first = extractColors(color)?.[0];
            return first ? normalizeColor(first) : "#888888";
        }

        return Color(typeof color === "string" ? color : formatColor(color)).hex();
    } catch {
        return "#888888";
    }
};

export const getThemeSwatchStops = (
    background: ColorLike,
    accent?: ColorLike,
): ThemeSwatchStop[] => {
    const raw =
        typeof background === "string"
            ? background
            : (formatColor(background) as string);

    if (!isValidGradient(raw)) {
        const bg = normalizeColor(raw);

        if (accent) {
            return [
                { color: bg, widthPercent: 58 },
                { color: normalizeColor(accent), widthPercent: 42 },
            ];
        }

        return [{ color: bg, widthPercent: 100 }];
    }

    const info = extractGradientInfo(raw);
    if (info?.colors.length) {
        const { colors, positions } = info;

        if (positions.length >= 2) {
            return colors.map((color, index) => {
                const start =
                    positions[index] ??
                    index / Math.max(colors.length - 1, 1);
                const end =
                    index === colors.length - 1
                        ? 1
                        : (positions[index + 1] ??
                          (index + 1) / Math.max(colors.length - 1, 1));

                return {
                    color: normalizeColor(color),
                    widthPercent: Math.max((end - start) * 100, 1),
                };
            });
        }

        return colors.map((color) => ({
            color: normalizeColor(color),
            widthPercent: 100 / colors.length,
        }));
    }

    const fallback = extractColors(raw) ?? ["#888888", "#cccccc"];
    return fallback.map((color) => ({
        color: normalizeColor(color),
        widthPercent: 100 / fallback.length,
    }));
};
