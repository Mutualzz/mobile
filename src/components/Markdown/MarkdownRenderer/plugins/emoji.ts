import { customEmojiRegex } from "@components/Markdown/MarkdownRenderer/plugins/customEmoji";
import { getEmoji } from "@utils/emojis";
import { TWEMOJI_URL } from "@utils/urls";
import unicodeEmojiRegex from "emojibase-regex";
import shortcodeRegex from "emojibase-regex/shortcode";
import type MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";

const emojiRegex = new RegExp(shortcodeRegex.source, "g");
const looseShortcodeRegex = /:([a-z0-9_+\-\s]{2,}):/gi;
const unicodePattern = new RegExp(unicodeEmojiRegex.source, "g");

const UNICODE_EMOJI_BETWEEN_COLONS =
    /:((?:\p{Extended_Pictographic}|\u200d|\uFE0F)+):/gu;

const normalizeUnicodeEmojiColons = (content: string) =>
    content.replace(UNICODE_EMOJI_BETWEEN_COLONS, "$1");

function findCustomEmojiRanges(content: string): [number, number][] {
    const ranges: [number, number][] = [];
    customEmojiRegex.lastIndex = 0;
    let match;
    while ((match = customEmojiRegex.exec(content))) {
        ranges.push([match.index, match.index + match[0].length]);
    }
    return ranges;
}

function isWithinRanges(index: number, ranges: [number, number][]) {
    return ranges.some(([start, end]) => index >= start && index < end);
}

function processEmojiTokens(tokens: Token[]) {
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type !== "text") {
            if (token.children) processEmojiTokens(token.children);
            continue;
        }

        const content = normalizeUnicodeEmojiColons(token.content);
        const customEmojiRanges = findCustomEmojiRanges(content);

        const newTokens: Token[] = [];
        let lastIndex = 0;
        let hasEmoji = false;

        const shortcodeMatches: {
            start: number;
            end: number;
            name: string;
        }[] = [];

        emojiRegex.lastIndex = 0;
        let match;
        while ((match = emojiRegex.exec(content))) {
            if (match.index > 0 && content[match.index - 1] === "<") {
                continue;
            }
            if (isWithinRanges(match.index, customEmojiRanges)) continue;

            shortcodeMatches.push({
                start: match.index,
                end: match.index + match[0].length,
                name: match[0].slice(1, -1),
            });
        }

        looseShortcodeRegex.lastIndex = 0;
        while ((match = looseShortcodeRegex.exec(content))) {
            const start = match.index;
            const end = start + match[0].length;
            if (start > 0 && content[start - 1] === "<") continue;
            if (isWithinRanges(start, customEmojiRanges)) continue;
            if (
                shortcodeMatches.some(
                    (existing) =>
                        existing.start <= start && existing.end >= end,
                )
            ) {
                continue;
            }

            const name = match[1];
            if (!getEmoji(name)) continue;

            shortcodeMatches.push({ start, end, name });
        }

        shortcodeMatches.sort((a, b) => a.start - b.start);

        for (const shortcodeMatch of shortcodeMatches) {
            const emojiData = getEmoji(shortcodeMatch.name);
            if (!emojiData) continue;
            if (shortcodeMatch.start < lastIndex) continue;

            if (lastIndex < shortcodeMatch.start) {
                const textToken = new Token("text", "", 0);
                textToken.content = content.slice(lastIndex, shortcodeMatch.start);
                textToken.level = token.level;
                newTokens.push(textToken);
            }

            const emojiToken = new Token("emoji", "", 0);
            emojiToken.content = emojiData.emoji;
            emojiToken.attrSet(
                "name",
                emojiData.shortcodes?.[0] || emojiData.emoji,
            );
            emojiToken.attrSet(
                "url",
                `${TWEMOJI_URL}/${emojiData.hexcode.toLowerCase()}.svg`,
            );
            emojiToken.attrSet("unicode", emojiData.emoji);
            emojiToken.level = token.level;
            newTokens.push(emojiToken);

            lastIndex = shortcodeMatch.end;
            hasEmoji = true;
        }

        if (!hasEmoji) {
            unicodePattern.lastIndex = 0;
            while ((match = unicodePattern.exec(content))) {
                if (isWithinRanges(match.index, customEmojiRanges)) continue;
                if (match.index < lastIndex) continue;

                const emojiData = getEmoji(match[0]);
                if (!emojiData) continue;

                if (lastIndex < match.index) {
                    const textToken = new Token("text", "", 0);
                    textToken.content = content.slice(lastIndex, match.index);
                    textToken.level = token.level;
                    newTokens.push(textToken);
                }

                const emojiToken = new Token("emoji", "", 0);
                emojiToken.content = emojiData.emoji;
                emojiToken.attrSet(
                    "name",
                    emojiData.shortcodes?.[0] || emojiData.emoji,
                );
                emojiToken.attrSet(
                    "url",
                    `${TWEMOJI_URL}/${emojiData.hexcode.toLowerCase()}.svg`,
                );
                emojiToken.attrSet("unicode", emojiData.emoji);
                emojiToken.level = token.level;
                newTokens.push(emojiToken);

                lastIndex = match.index + match[0].length;
                hasEmoji = true;
            }
        }

        if (!hasEmoji) {
            if (content !== token.content) {
                token.content = content;
            }
            continue;
        }

        if (lastIndex < content.length) {
            const textToken = new Token("text", "", 0);
            textToken.content = content.slice(lastIndex);
            textToken.level = token.level;
            newTokens.push(textToken);
        }

        tokens.splice(i, 1, ...newTokens);
        i += newTokens.length - 1;
    }
}

export const emojiPlugin = (md: MarkdownIt) => {
    md.core.ruler.after("inline", "emoji", (state) => {
        for (const token of state.tokens) {
            if (token.type === "inline" && token.children) {
                processEmojiTokens(token.children);
            }
        }
    });

    md.renderer.rules.emoji = (tokens, idx) => {
        const token = tokens[idx];

        return `<span class="emoji" data-name="${md.utils.escapeHtml(token.attrGet("name") ?? "")}" data-url="${md.utils.escapeHtml(token.attrGet("url") ?? "")}" data-unicode="${md.utils.escapeHtml(token.attrGet("unicode") ?? "")}">${token.content}</span>`;
    };
};
