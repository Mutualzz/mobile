import { TWEMOJI_PNG_URL, TWEMOJI_URL } from "@utils/urls";

export function emojiValueToUnified(value: string) {
  const parts: string[] = [];

  for (let index = 0; index < value.length; ) {
    const codePoint = value.codePointAt(index)!;
    parts.push(codePoint.toString(16).toUpperCase());
    index += codePoint > 0xffff ? 2 : 1;
  }

  return parts.join("-");
}

export function normalizeTwemojiUnified(unified: string) {
  return unified
    .toLowerCase()
    .split("-")
    .filter((part) => part !== "fe0f")
    .join("-");
}

export function getTwemojiUrlForUnified(unified: string) {
  return `${TWEMOJI_URL}/${normalizeTwemojiUnified(unified)}.svg`;
}

export function getTwemojiPngUrlForUnified(unified: string) {
  return `${TWEMOJI_PNG_URL}/${normalizeTwemojiUnified(unified)}.png`;
}

export function getTwemojiUrlForValue(value: string) {
  return getTwemojiUrlForUnified(emojiValueToUnified(value));
}

export function getTwemojiPngUrlForValue(value: string) {
  return getTwemojiPngUrlForUnified(emojiValueToUnified(value));
}

export function getTwemojiPngUrlCandidatesForValue(value: string) {
  const unified = emojiValueToUnified(value).toLowerCase();
  const normalized = normalizeTwemojiUnified(unified);

  return [...new Set([normalized, unified])].map(
    (hex) => `${TWEMOJI_PNG_URL}/${hex}.png`,
  );
}

export function getTwemojiUrlCandidatesForValue(value: string) {
  const unified = emojiValueToUnified(value).toLowerCase();
  const normalized = normalizeTwemojiUnified(unified);

  return [...new Set([normalized, unified])].map(
    (hex) => `${TWEMOJI_URL}/${hex}.svg`,
  );
}
