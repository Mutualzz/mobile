import type { ProfileBlockSize, ProfileBlockType } from "@mutualzz/types";

export const WIDGET_TILE_HEIGHTS: Record<ProfileBlockSize, number> = {
  s: 120,
  m: 180,
  l: 260,
};

/** Divider has no content that benefits from the shared tile heights above —
 * it just needs to read as a thin break, not an oversized empty card. */
const DIVIDER_TILE_HEIGHTS: Record<ProfileBlockSize, number> = {
  s: 32,
  m: 32,
  l: 40,
};

export const getWidgetTileHeight = (
  type: ProfileBlockType,
  size: ProfileBlockSize,
): number => (type === "divider" ? DIVIDER_TILE_HEIGHTS[size] : WIDGET_TILE_HEIGHTS[size]);

export const WIDGET_SUPPORTED_SIZES: Record<ProfileBlockType, ProfileBlockSize[]> = {
  header: ["m", "l"],
  text: ["s", "m", "l"],
  image: ["s", "m", "l"],
  music: ["s", "m", "l"],
  links: ["s", "m", "l"],
  activity: ["s", "m"],
  roles: ["s", "m", "l"],
  mutual: ["s", "m", "l"],
  divider: ["m", "l"],
  quote: ["s", "m", "l"],
  draw: ["s", "m", "l"],
};

export const WIDGET_MAXIMIZABLE_TYPES: Partial<Record<ProfileBlockType, boolean>> = {
  text: true,
  image: true,
  links: true,
  roles: true,
  mutual: true,
  quote: true,
  draw: true,
};

export const isWidgetMaximizable = (type: ProfileBlockType) =>
  WIDGET_MAXIMIZABLE_TYPES[type] === true;

export const clampWidgetSize = (
  type: ProfileBlockType,
  size: ProfileBlockSize,
): ProfileBlockSize => {
  const supported = WIDGET_SUPPORTED_SIZES[type];
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

/**
 * Same flow-wrap packing the read-only grid gets from CSS flexWrap (S = half
 * row, two S's share a row; M/L always take a full row) — computed explicitly
 * here so the editor can position tiles identically and use the resulting
 * rects for drag hit-testing.
 */
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
        rects.push({ id: item.id, left: "0%", top: cursorY, width: "50%", height: item.height });
      } else {
        rects.push({ id: item.id, left: "50%", top: cursorY, width: "50%", height: item.height });
        cursorY += Math.max(pending.height, item.height) + rowGap;
        pending = null;
      }
    } else {
      if (pending) {
        cursorY += pending.height + rowGap;
        pending = null;
      }
      rects.push({ id: item.id, left: "0%", top: cursorY, width: "100%", height: item.height });
      cursorY += item.height + rowGap;
    }
  }
  if (pending) cursorY += pending.height + rowGap;

  return { rects, totalHeight: Math.max(0, cursorY - rowGap) };
}
