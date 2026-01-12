import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";

export const underlinePlugin = (md: MarkdownIt) => {
    md.core.ruler.after("inline", "underline", (state) => {
        const tokens = state.tokens;
        for (let i = 0; i < tokens.length; i++) {
            const children = tokens[i].children;
            if (tokens[i].type === "inline" && children) {
                for (let j = 0; j < children.length; j++) {
                    const token = children[j];
                    if (token.type === "text" && token.content.includes("__")) {
                        const newTokens: Token[] = [];
                        let lastIndex = 0;
                        const regex = /__([^_]+?)__/g;
                        let match;
                        let content = token.content;

                        while ((match = regex.exec(content))) {
                            if (match.index > lastIndex) {
                                const textToken = new Token("text", "", 0);
                                textToken.content = content.slice(
                                    lastIndex,
                                    match.index,
                                );
                                textToken.level = token.level;
                                newTokens.push(textToken);
                            }
                            const underlineToken = new Token(
                                "underline",
                                "",
                                0,
                            );
                            underlineToken.content = match[1];
                            underlineToken.level = token.level;
                            newTokens.push(underlineToken);

                            lastIndex = match.index + match[0].length;
                        }

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

    md.renderer.rules.underline = (tokens, idx) => {
        const token = tokens[idx];
        return `<u>${md.utils.escapeHtml(token.content)}</u>`;
    };
};
