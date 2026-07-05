import { customEmojiRegex } from "@components/Markdown/MarkdownRenderer/plugins/customEmoji";
import { getEmoji } from "@utils/emojis";
import { TWEMOJI_URL } from "@utils/urls";
import unicodeEmojiRegex from "emojibase-regex";
import shortcodeRegex from "emojibase-regex/shortcode";
import type MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";

const shortcodePattern = new RegExp(shortcodeRegex.source, "g");
const unicodePattern = new RegExp(unicodeEmojiRegex.source, "g");

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

export const emojiPlugin = (md: MarkdownIt) => {
  md.core.ruler.after("inline", "emoji", (state) => {
    const tokens = state.tokens;

    for (const token of tokens) {
      if (token.type === "inline") {
        const content = token.content;
        const newTokens: Token[] = [];
        let lastIndex = 0;

        const customEmojiRanges = findCustomEmojiRanges(content);

        const matches: { start: number; end: number; raw: string }[] = [];

        shortcodePattern.lastIndex = 0;
        let match;
        while ((match = shortcodePattern.exec(content))) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            raw: match[0].slice(1, -1),
          });
        }

        unicodePattern.lastIndex = 0;
        while ((match = unicodePattern.exec(content))) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            raw: match[0],
          });
        }

        matches.sort((a, b) => a.start - b.start);

        for (const emojiMatch of matches) {
          if (isWithinRanges(emojiMatch.start, customEmojiRanges)) {
            continue;
          }
          if (emojiMatch.start < lastIndex) {
            continue;
          }

          const emojiData = getEmoji(emojiMatch.raw);
          if (!emojiData) continue;

          if (lastIndex < emojiMatch.start) {
            const textToken = new Token("text", "", 0);
            textToken.content = content.slice(lastIndex, emojiMatch.start);
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

          lastIndex = emojiMatch.end;
        }

        if (lastIndex < content.length) {
          const textToken = new Token("text", "", 0);
          textToken.content = content.slice(lastIndex);
          textToken.level = token.level;
          newTokens.push(textToken);
        }

        if (newTokens.length && newTokens.some((t) => t.type === "emoji")) {
          token.children = newTokens;
        }
      }
    }
  });

  md.renderer.rules.emoji = (tokens, idx) => {
    const token = tokens[idx];

    return `<span class="emoji" data-name="${md.utils.escapeHtml(token.attrGet("name") ?? "")}" data-url="${md.utils.escapeHtml(token.attrGet("url") ?? "")}" data-unicode="${md.utils.escapeHtml(token.attrGet("unicode") ?? "")}">${token.content}</span>`;
  };
};
