import Token from "markdown-it/lib/token.mjs";
import type MarkdownIt from "markdown-it";
import { customEmojiRegex, processCustomEmojiTokens } from "@mutualzz/client";

export { customEmojiRegex };

export const customEmojiPlugin = (md: MarkdownIt) => {
  md.core.ruler.after("emoji", "customEmoji", (state) => {
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i];

      if (token.type === "inline" && token.children) {
        processCustomEmojiTokens(token.children);
        continue;
      }

      if (token.type !== "inline" || !token.content) continue;

      const newTokens: Token[] = [];
      let lastIndex = 0;
      let match;

      customEmojiRegex.lastIndex = 0;

      while ((match = customEmojiRegex.exec(token.content))) {
        if (lastIndex < match.index) {
          const textToken = new Token("text", "", 0);
          textToken.content = token.content.slice(lastIndex, match.index);
          textToken.level = token.level;
          newTokens.push(textToken);
        }

        const emojiToken = new Token("customEmoji", "", 0);
        emojiToken.content = match[0];
        emojiToken.level = token.level;
        newTokens.push(emojiToken);

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < token.content.length) {
        const textToken = new Token("text", "", 0);
        textToken.content = token.content.slice(lastIndex);
        textToken.level = token.level;
        newTokens.push(textToken);
      }

      if (newTokens.some((t) => t.type === "customEmoji")) {
        token.children = newTokens;
        token.content = "";
      }
    }
  });
};
