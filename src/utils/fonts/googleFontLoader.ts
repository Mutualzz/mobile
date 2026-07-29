import {
  getFontByFamily,
  type CustomFontExt,
} from "@mutualzz/ui-core";
import { CDNRoutes } from "@mutualzz/types";
import * as Font from "expo-font";
import { REST } from "@stores/REST.store";

const loaded = new Set<string>();
const pending = new Map<string, Promise<void>>();

function bunnyFileUrl(family: string, weight: number) {
  const slug = family.toLowerCase().replace(/\s+/g, "-");
  return `https://fonts.bunny.net/${slug}/files/${slug}-latin-${weight}-normal.woff2`;
}

export async function ensureGoogleFont(family: string | null | undefined) {
  if (!family) return;

  const font = getFontByFamily(family);
  if (!font) return;

  const key = font.family;
  if (loaded.has(key)) return;

  const inflight = pending.get(key);
  if (inflight) return inflight;

  const request = (async () => {
    const weight = font.weights.includes(400) ? 400 : font.weights[0];
    await Font.loadAsync({
      [font.family]: bunnyFileUrl(font.family, weight),
    });
    loaded.add(key);
  })().finally(() => {
    pending.delete(key);
  });

  pending.set(key, request);
  return request;
}

export async function ensureCustomFont(
  userId: string,
  hash: string,
  ext: CustomFontExt = "woff2",
  cssFamily: string,
) {
  const key = `${userId}:${hash}`;
  if (loaded.has(key)) return;

  const inflight = pending.get(key);
  if (inflight) return inflight;

  const request = (async () => {
    await Font.loadAsync({
      [cssFamily]: REST.makeCDNUrl(CDNRoutes.profileFont(userId, hash, ext)),
    });
    loaded.add(key);
  })().finally(() => {
    pending.delete(key);
  });

  pending.set(key, request);
  return request;
}
