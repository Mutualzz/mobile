import type MarkdownIt from "markdown-it";
import { processMentionTokens } from "@mutualzz/client";

export const mentionPlugin = (md: MarkdownIt) => {
  md.core.ruler.after("inline", "mention", (state) => {
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i];
      if (token.type === "inline" && token.children) {
        processMentionTokens(token.children);
      }
    }
  });
};
