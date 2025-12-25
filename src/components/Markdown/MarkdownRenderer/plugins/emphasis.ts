import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";

export const emphasisPlugin = (md: MarkdownIt) => {
    md.core.ruler.after("inline", "emphasis", (state) => {
        const tokens = state.tokens;
        for (let i = 0; i < tokens.length; i++) {
            const children = tokens[i].children;
            if (tokens[i].type === "inline" && children) {
                for (let j = 0; j < children.length; j++) {
                    const token = children[j];
                    // Bold: **text**
                    if (token.type === "text" && token.content.includes("**")) {
                        const regex = /\*\*([^*]+?)\*\*/g;
                        let lastIndex = 0;
                        let match;
                        const newTokens: Token[] = [];
                        const content = token.content;

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
                            const boldToken = new Token("strong", "", 0);
                            boldToken.content = match[1];
                            boldToken.level = token.level;
                            newTokens.push(boldToken);

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
                    // Italic: *text*
                    else if (
                        token.type === "text" &&
                        token.content.includes("*")
                    ) {
                        const regex = /\*([^*]+?)\*/g;
                        let lastIndex = 0;
                        let match;
                        const newTokens: Token[] = [];
                        const content = token.content;

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
                            const italicToken = new Token("em", "", 0);
                            italicToken.content = match[1];
                            italicToken.level = token.level;
                            newTokens.push(italicToken);

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
                    // Italic: _text_
                    else if (
                        token.type === "text" &&
                        token.content.includes("_")
                    ) {
                        // Only match _text_ (not __text__)
                        const regex = /_([^_]+?)_/g;
                        let lastIndex = 0;
                        let match;
                        const newTokens: Token[] = [];
                        const content = token.content;

                        while ((match = regex.exec(content))) {
                            // Add text before italic
                            if (match.index > lastIndex) {
                                const textToken = new Token("text", "", 0);
                                textToken.content = content.slice(
                                    lastIndex,
                                    match.index,
                                );
                                textToken.level = token.level;
                                newTokens.push(textToken);
                            }
                            // Add italic token
                            const italicToken = new Token("em", "", 0);
                            italicToken.content = match[1];
                            italicToken.level = token.level;
                            newTokens.push(italicToken);

                            lastIndex = match.index + match[0].length;
                        }
                        // Add remaining text (including standalone _)
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

    md.renderer.rules.strong = (tokens, idx) => {
        const token = tokens[idx];
        return `<strong>${md.utils.escapeHtml(token.content)}</strong>`;
    };

    md.renderer.rules.em = (tokens, idx) => {
        const token = tokens[idx];
        return `<em>${md.utils.escapeHtml(token.content)}</em>`;
    };
};
