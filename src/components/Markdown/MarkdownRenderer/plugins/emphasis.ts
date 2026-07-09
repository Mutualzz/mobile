import type MarkdownIt from "markdown-it";
import { splitByMarker } from "@components/Markdown/MarkdownRenderer/plugins/splitByMarker";

export const emphasisPlugin = (md: MarkdownIt) => {
    md.core.ruler.after("inline", "emphasis", (state) => {
        for (const token of state.tokens) {
            const children = token.children;
            if (token.type !== "inline" || !children) continue;

            splitByMarker(children, /\*\*([^*]+?)\*\*/g, "strong");
            splitByMarker(children, /\*([^*]+?)\*/g, "em");
            splitByMarker(children, /_([^_]+?)_/g, "em");
        }
    });
};
