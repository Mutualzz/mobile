export function unifiedToEmoji(unified: string) {
    return unified
        .split("-")
        .map((code) => String.fromCodePoint(parseInt(code, 16)))
        .join("");
}

export function buildUnifiedWithSkinTone(
    unified: string,
    skinTone?: string | null,
) {
    if (!skinTone) return unified;
    return `${unified}-${skinTone}`;
}
