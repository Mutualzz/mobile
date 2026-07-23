import type MarkdownIt from "markdown-it";
import { processLinkTokens } from "@mutualzz/client";

export const linkPlugin = (md: MarkdownIt) => {
  md.core.ruler.after("inline", "link", (state) => {
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i];
      if (token.type === "inline" && token.children) {
        processLinkTokens(token.children);
      }
    }
  });
};
