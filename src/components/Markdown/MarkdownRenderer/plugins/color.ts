import type MarkdownIt from "markdown-it";
import { processColorTokens } from "@mutualzz/client";

export const colorPlugin = (md: MarkdownIt) => {
  md.core.ruler.after("inline", "color", (state) => {
    for (const token of state.tokens) {
      const children = token.children;
      if (token.type !== "inline" || !children) continue;
      processColorTokens(children);
    }
  });
};
