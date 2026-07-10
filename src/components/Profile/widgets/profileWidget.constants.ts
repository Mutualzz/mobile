import type { ProfileBlockSize, ProfileBlockType } from "@mutualzz/types";

export const WIDGET_TILE_HEIGHTS: Record<ProfileBlockSize, number> = {
  s: 120,
  m: 180,
  l: 260,
};

const HEADER_TILE_HEIGHTS: Record<"m" | "l", number> = {
  m: 156,
  l: 236,
};

const LINKS_TILE_HEIGHTS: Record<ProfileBlockSize, number> = {
  s: 112,
  m: 168,
  l: 248,
};

const ACTIVITY_TILE_HEIGHTS: Record<"s" | "m", number> = {
  s: 132,
  m: 168,
};

const DIVIDER_TILE_HEIGHTS: Record<ProfileBlockSize, number> = {
  s: 32,
  m: 32,
  l: 40,
};

export const getWidgetTileHeight = (
  type: ProfileBlockType,
  size: ProfileBlockSize,
): number => {
  if (type === "divider") return DIVIDER_TILE_HEIGHTS[size];
  if (type === "header" && (size === "m" || size === "l")) {
    return HEADER_TILE_HEIGHTS[size];
  }
  if (type === "links") return LINKS_TILE_HEIGHTS[size];
  if (type === "activity" && (size === "s" || size === "m")) {
    return ACTIVITY_TILE_HEIGHTS[size];
  }
  return WIDGET_TILE_HEIGHTS[size];
};

export const WIDGET_SUPPORTED_SIZES: Record<
  ProfileBlockType,
  ProfileBlockSize[]
> = {
  header: ["m", "l"],
  text: ["s", "m", "l"],
  image: ["s", "m", "l"],
  sticker: ["s", "m", "l"],
  music: ["s", "m", "l"],
  links: ["s", "m", "l"],
  activity: ["s", "m"],
  roles: ["s", "m", "l"],
  mutual: ["s", "m", "l"],
  divider: ["m", "l"],
  quote: ["s", "m", "l"],
  draw: ["s", "m", "l"],
};

export const WIDGET_MAXIMIZABLE_TYPES: Partial<
  Record<ProfileBlockType, boolean>
> = {
  text: true,
  links: true,
  activity: true,
  roles: true,
  mutual: true,
  quote: true,
  draw: true,
};

export const isWidgetMaximizable = (type: ProfileBlockType) =>
  WIDGET_MAXIMIZABLE_TYPES[type] === true;

const DEFAULT_SUPPORTED_SIZES: ProfileBlockSize[] = ["s", "m", "l"];

export const getSupportedWidgetSizes = (
  type: ProfileBlockType,
): ProfileBlockSize[] => WIDGET_SUPPORTED_SIZES[type] ?? DEFAULT_SUPPORTED_SIZES;

export const clampWidgetSize = (
  type: ProfileBlockType,
  size: ProfileBlockSize,
): ProfileBlockSize => {
  const supported = getSupportedWidgetSizes(type);
  if (supported.includes(size)) return size;
  return supported[supported.length - 1];
};

export interface PackedRect {
  id: string;
  left: "0%" | "50%";
  top: number;
  width: "50%" | "100%";
  height: number;
}

export function computePackedLayout(
  items: { id: string; size: ProfileBlockSize; height: number }[],
  rowGap = 10,
): { rects: PackedRect[]; totalHeight: number } {
  const rects: PackedRect[] = [];
  let cursorY = 0;
  let pending: { id: string; height: number } | null = null;

  for (const item of items) {
    if (item.size === "s") {
      if (!pending) {
        pending = { id: item.id, height: item.height };
        rects.push({
          id: item.id,
          left: "0%",
          top: cursorY,
          width: "50%",
          height: item.height,
        });
      } else {
        rects.push({
          id: item.id,
          left: "50%",
          top: cursorY,
          width: "50%",
          height: item.height,
        });
        cursorY += Math.max(pending.height, item.height) + rowGap;
        pending = null;
      }
    } else {
      if (pending) {
        cursorY += pending.height + rowGap;
        pending = null;
      }
      rects.push({
        id: item.id,
        left: "0%",
        top: cursorY,
        width: "100%",
        height: item.height,
      });
      cursorY += item.height + rowGap;
    }
  }
  if (pending) cursorY += pending.height + rowGap;

  return { rects, totalHeight: Math.max(0, cursorY - rowGap) };
}
