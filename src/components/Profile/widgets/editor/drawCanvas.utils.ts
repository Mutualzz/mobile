import { createColor, formatColor, handleColor } from "@mutualzz/ui-core";
import type { DrawCanvasState, DrawStroke } from "./ProfileDrawCanvas";
import { PROFILE_DRAW_CANVAS_SIZE } from "./drawCanvas.constants";

const DEFAULT_BACKGROUND = "#1a1a2e";

export const BRUSH_COLORS = [
  "#000000",
  "#ffffff",
  "#f4f4f5",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
] as const;

export function normalizeHexColor(color: string, fallback = DEFAULT_BACKGROUND) {
  try {
    return formatColor(handleColor(color).hex);
  } catch {
    return fallback;
  }
}

export function brushContrastsWithBackground(
  brush: string,
  background: string,
  minLightnessDelta = 25,
) {
  try {
    const brushLightness = createColor(handleColor(brush).hex).lightness();
    const backgroundLightness = createColor(handleColor(background).hex).lightness();
    return (
      Math.abs(brushLightness - backgroundLightness) >= minLightnessDelta
    );
  } catch {
    return true;
  }
}

export function getDefaultBrushColor(background: string) {
  try {
    return createColor(handleColor(background).hex).isLight()
      ? "#000000"
      : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

export function resolveInitialBrushColor(
  background: string,
  initial: DrawCanvasState | null,
) {
  const lastStroke = initial?.strokes.at(-1)?.color;
  if (lastStroke) {
    const normalized = normalizeHexColor(lastStroke, lastStroke);
    if (brushContrastsWithBackground(normalized, background)) {
      return normalized;
    }
  }

  const preferred = BRUSH_COLORS.find((color) =>
    brushContrastsWithBackground(color, background),
  );

  return preferred ?? getDefaultBrushColor(background);
}

export function visibleBrushColors(background: string) {
  return BRUSH_COLORS.filter((color) =>
    brushContrastsWithBackground(color, background),
  );
}

interface SketchCanvasPath {
  drawMode?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  paths?: string[];
}

function isDrawCanvasState(value: unknown): value is DrawCanvasState {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as DrawCanvasState).strokes)
  );
}

function convertSketchPathsToState(
  paths: SketchCanvasPath[],
  backgroundColor: string,
): DrawCanvasState {
  const strokes: DrawStroke[] = [];

  for (const entry of paths) {
    if (!entry.paths?.length) continue;

    strokes.push({
      d: entry.paths.join(" "),
      color: entry.drawMode
        ? backgroundColor
        : (entry.strokeColor ?? getDefaultBrushColor(backgroundColor)),
      width: entry.strokeWidth ?? 4,
    });
  }

  return {
    strokes,
    backgroundColor,
    canvasSize: PROFILE_DRAW_CANVAS_SIZE,
  };
}

export function parseDrawCanvasState(
  paths: string | null,
  backgroundColor?: string | null,
): DrawCanvasState | null {
  if (!paths) return null;

  const resolvedBackground = backgroundColor ?? DEFAULT_BACKGROUND;

  try {
    const parsed: unknown = JSON.parse(paths);

    if (isDrawCanvasState(parsed)) {
      return {
        strokes: parsed.strokes,
        backgroundColor: parsed.backgroundColor ?? resolvedBackground,
        canvasSize: parsed.canvasSize ?? PROFILE_DRAW_CANVAS_SIZE,
      };
    }

    if (Array.isArray(parsed)) {
      return convertSketchPathsToState(parsed, resolvedBackground);
    }
  } catch {
    return null;
  }

  return null;
}
