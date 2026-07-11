import {
  extractColors,
  formatColor,
  isValidGradient,
  type ColorLike,
} from "@mutualzz/ui-core";
import {
  getAppIconName,
  setAlternateAppIcon,
  supportsAlternateIcons,
} from "expo-alternate-app-icons";

/** Default Mutualzz brand purple */
export const DEFAULT_APP_ICON_COLOR = "#88449a";

export const APP_ICON_VARIANTS = [
  { name: "Crimson", color: "#E1556B" },
  { name: "Rose", color: "#A23A4F" },
  { name: "Ocean", color: "#63A9C8" },
  { name: "Teal", color: "#2AA8A3" },
  { name: "Rust", color: "#D09663" },
  { name: "Violet", color: "#9F6CDA" },
  { name: "Steel", color: "#98A0D6" },
  { name: "Gold", color: "#C08A2A" },
] as const;

export type AppIconName = (typeof APP_ICON_VARIANTS)[number]["name"];

function toSolidHex(color: ColorLike): string {
  const resolved = isValidGradient(color)
    ? (extractColors(color)?.[0] ?? color)
    : color;

  return formatColor(resolved, { format: "hex" });
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const value = match[1];
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

export function resolveAppIconName(
  primaryColor: ColorLike,
): AppIconName | null {
  const hex = toSolidHex(primaryColor);
  const target = parseHex(hex);
  if (!target) return null;

  const defaultRgb = parseHex(DEFAULT_APP_ICON_COLOR)!;
  let bestName: AppIconName | null = null;
  let bestDistance = colorDistance(target, defaultRgb);

  for (const variant of APP_ICON_VARIANTS) {
    const rgb = parseHex(variant.color);
    if (!rgb) continue;

    const distance = colorDistance(target, rgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestName = variant.name;
    }
  }

  return bestName;
}

let lastAppliedIcon: string | null | undefined;

export async function syncAppIcon(primaryColor: ColorLike): Promise<void> {
  if (!supportsAlternateIcons) return;

  const next = resolveAppIconName(primaryColor);

  if (lastAppliedIcon === undefined) lastAppliedIcon = getAppIconName();
  if (lastAppliedIcon === next) return;

  try {
    await setAlternateAppIcon(next);
    lastAppliedIcon = next;
  } catch (error) {
    console.warn("Failed to set alternate app icon:", error);
  }
}
