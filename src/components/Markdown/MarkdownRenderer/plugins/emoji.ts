import { getEmoji } from "@utils/emojis";
import { TWEMOJI_URL } from "@utils/urls";
import shortcodeRegex from "emojibase-regex/shortcode";
import type MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";

const emojiRegex = new RegExp(shortcodeRegex.source, "g");

export const emojiPlugin = (md: MarkdownIt) => {
    md.core.ruler.after("inline", "emoji", (state) => {
        const tokens = state.tokens;

        for (const token of tokens) {
            if (token.type === "inline") {
                const content = token.content;
                const newTokens: Token[] = [];
                let lastIndex = 0;
                let match;

                emojiRegex.lastIndex = 0;

                while ((match = emojiRegex.exec(content))) {
                    const emojiName = match[0].slice(1, -1);
                    const emojiData = getEmoji(emojiName);

                    if (emojiData) {
                        if (lastIndex < match.index) {
                            const textToken = new Token("text", "", 0);
                            textToken.content = content.slice(
                                lastIndex,
                                match.index,
                            );
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
                    }
                }

                if (lastIndex < content.length) {
                    const textToken = new Token("text", "", 0);
                    textToken.content = content.slice(lastIndex);
                    textToken.level = token.level;
                    newTokens.push(textToken);
                }

                if (
                    newTokens.length &&
                    newTokens.some((t) => t.type === "emoji")
                ) {
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
