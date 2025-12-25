import baseEmoticonRegex from "emojibase-regex/emoticon";
import shortcodeRegex from "emojibase-regex/shortcode";
import { getEmoji } from "../emojis";
import { clampSelection, replaceRange } from "./textUtils";
import type { Selection } from "./types";

const extendedEmoticons = [":3", ">.<", "T^T", "T_T", "x_x"];

const escapedCustom = extendedEmoticons
    .map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

const combinedPattern = `(?:${baseEmoticonRegex.source}|${escapedCustom})`;

const emoticonAtEndRegex = new RegExp(`(?:^|\\s)(${combinedPattern})$`);

const localShortcodeRegex = new RegExp(shortcodeRegex.source, "g");

export type EmojiTransformOptions = {
    enableEmoticons?: boolean;
};

export function applyEmojiTransforms(
    nextTextRaw: string,
    selectionRaw: Selection,
    opts: EmojiTransformOptions,
): {
    text: string;
    selection: Selection;
    didTransform: boolean;
    emoji?: {
        name: string;
        hexCode: string;
        unicode: string;
    };
} {
    const nextText = nextTextRaw;
    let sel = clampSelection(nextText, selectionRaw);

    if (sel.start !== sel.end)
        return { text: nextText, selection: sel, didTransform: false };

    const caret = sel.start;

    {
        const windowStart = Math.max(0, caret - 96);
        const before = nextText.slice(windowStart, caret);

        localShortcodeRegex.lastIndex = 0;
        let lastShort: RegExpExecArray | null = null;

        for (
            let m = localShortcodeRegex.exec(before);
            m;
            m = localShortcodeRegex.exec(before)
        ) {
            lastShort = m;
        }

        if (lastShort) {
            const shortcode = lastShort[0];
            const absStart = windowStart + lastShort.index;
            const absEnd = absStart + shortcode.length;

            if (absEnd === caret) {
                const emoji = getEmoji(shortcode.replace(/:/g, ""));
                if (emoji) {
                    const rep = replaceRange(
                        nextText,
                        absStart,
                        absEnd,
                        emoji.emoji,
                    );
                    const newCaret = caret + rep.delta;

                    return {
                        text: rep.text,
                        emoji: {
                            name: emoji.label,
                            hexCode: emoji.hexcode,
                            unicode: emoji.emoji,
                        },
                        selection: { start: newCaret, end: newCaret },
                        didTransform: true,
                    };
                }
            }
        }
    }

    if (opts.enableEmoticons) {
        if (caret > 0) {
            const charBeforeCaret = nextText[caret - 1];

            if (charBeforeCaret && /\s/.test(charBeforeCaret)) {
                const searchEnd = caret - 1;
                const windowStart = Math.max(0, searchEnd - 96);
                const before = nextText.slice(windowStart, searchEnd);

                const m = before.match(emoticonAtEndRegex);
                const emoticon = m?.[1];

                if (emoticon) {
                    const absEnd = searchEnd;
                    const absStart = absEnd - emoticon.length;

                    const emoji = getEmoji(emoticon);
                    if (emoji) {
                        const rep = replaceRange(
                            nextText,
                            absStart,
                            absEnd,
                            emoji.emoji,
                        );
                        const newCaret = caret + rep.delta;

                        return {
                            text: rep.text,
                            emoji: {
                                name: emoji.label,
                                hexCode: emoji.hexcode,
                                unicode: emoji.emoji,
                            },
                            selection: { start: newCaret, end: newCaret },
                            didTransform: true,
                        };
                    }
                }
            }
        }
    }

    return { text: nextText, selection: sel, didTransform: false };
}
