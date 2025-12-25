import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";

export const spoilerPlugin = (md: MarkdownIt) => {
    md.core.ruler.after("inline", "spoiler", (state) => {
        const tokens = state.tokens;
        for (let i = 0; i < tokens.length; i++) {
            const children = tokens[i].children;
            if (tokens[i].type === "inline" && children) {
                for (let j = 0; j < children.length; j++) {
                    const token = children[j];
                    if (token.type === "text" && token.content.includes("||")) {
                        const regex = /\|\|([^|]+?)\|\|/g;
                        let lastIndex = 0;
                        let match;
                        const newTokens: Token[] = [];
                        const content = token.content;

                        while ((match = regex.exec(content))) {
                            // Add text before spoiler
                            if (match.index > lastIndex) {
                                const textToken = new Token("text", "", 0);
                                textToken.content = content.slice(
                                    lastIndex,
                                    match.index,
                                );
                                textToken.level = token.level;
                                newTokens.push(textToken);
                            }
                            // Add spoiler token
                            const spoilerToken = new Token("spoiler", "", 0);
                            spoilerToken.content = match[1];
                            spoilerToken.level = token.level;
                            newTokens.push(spoilerToken);

                            lastIndex = match.index + match[0].length;
                        }

                        // Add remaining text (including standalone ||)
                        if (lastIndex < content.length) {
                            const textToken = new Token("text", "", 0);
                            textToken.content = content.slice(lastIndex);
                            textToken.level = token.level;
                            newTokens.push(textToken);
                        }

                        if (newTokens.length > 0) {
                            children.splice(j, 1, ...newTokens);
                            j += newTokens.length - 1;
                        }
                    }
                }
            }
        }
    });

    md.renderer.rules.spoiler = (tokens, idx) => {
        const token = tokens[idx];
        return `<spoiler>${md.utils.escapeHtml(token.content)}</spoiler>`;
    };
};
