import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";

export const strikethroughPlugin = (md: MarkdownIt) => {
    md.core.ruler.after("inline", "strikethrough", (state) => {
        const tokens = state.tokens;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].type === "text" && tokens[i].content.includes("~~")) {
                const parts = tokens[i].content.split(/(~~)/);
                const newTokens: Token[] = [];
                let strikeOpen = false;
                for (const part of parts) {
                    if (part === "~~") {
                        strikeOpen = !strikeOpen;
                    } else if (strikeOpen && part) {
                        const strikeToken = new Token("strikethrough", "", 0);
                        strikeToken.content = part;
                        strikeToken.level = tokens[i].level;
                        newTokens.push(strikeToken);
                    } else if (part) {
                        const textToken = new Token("text", "", 0);
                        textToken.content = part;
                        textToken.level = tokens[i].level;
                        newTokens.push(textToken);
                    }
                }
                tokens.splice(i, 1, ...newTokens);
                i += newTokens.length - 1;
            }
        }
    });

    md.renderer.rules.strikethrough = (tokens, idx) => {
        const token = tokens[idx];
        return `<del>${md.utils.escapeHtml(token.content)}</del>`;
    };
};
