import {
  getCustomFontCssFamily,
  parseCustomFontRef,
  parseFontFamily,
} from "@mutualzz/ui-core";
import { ensureCustomFont, ensureGoogleFont } from "@utils/fonts/googleFontLoader";

export async function ensureAppFont(
  family: string | null | undefined,
  ownerUserId?: string | null,
) {
  if (!family) return;

  const customFont = parseCustomFontRef(family);
  if (customFont) {
    if (!ownerUserId) return;
    const cssFamily = getCustomFontCssFamily(customFont.hash);
    await ensureCustomFont(
      ownerUserId,
      customFont.hash,
      customFont.ext,
      cssFamily,
    );
    return;
  }

  const parsed = parseFontFamily(family);
  await ensureGoogleFont(parsed?.type === "web" ? parsed.family : family);
}
