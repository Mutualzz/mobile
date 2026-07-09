import type MarkdownIt from "markdown-it";
import { splitByMarker } from "@components/Markdown/MarkdownRenderer/plugins/splitByMarker";

export const strikethroughPlugin = (md: MarkdownIt) => {
  md.core.ruler.after("inline", "strikethrough", (state) => {
    for (const token of state.tokens) {
      const children = token.children;
      if (token.type !== "inline" || !children) continue;

      splitByMarker(children, /~~([^~]+?)~~/g, "s");
    }
  });
};
