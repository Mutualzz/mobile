import Token from "markdown-it/lib/token.mjs";
import type MarkdownIt from "markdown-it";

const urlRegex = /https:\/\/[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+/g;

function stripMarkdownSuffix(url: string) {
    while (url.length) {
        const c = url[url.length - 1];
        if (c === "*" || c === "_" || c === "~" || c === "|") {
            url = url.slice(0, -1);
            continue;
        }
        break;
    }
    return url;
}

function processTokens(tokens: Token[]) {
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === "text") {
            const content = token.content;
            urlRegex.lastIndex = 0;
            if (!urlRegex.test(content)) {
                continue;
            }

            let lastIndex = 0;
            let match;

            const newTokens: Token[] = [];
            urlRegex.lastIndex = 0;

            while ((match = urlRegex.exec(content))) {
                if (match.index > lastIndex) {
                    const textToken = new Token("text", "", 0);
                    textToken.content = content.slice(lastIndex, match.index);
                    textToken.level = token.level;
                    newTokens.push(textToken);
                }

                const linkToken = new Token("link", "", 0);
                const rawUrl = match[0];
                const url = stripMarkdownSuffix(rawUrl);
                const strippedSuffix = rawUrl.slice(url.length);

                linkToken.content = url;
                linkToken.attrSet("href", url);
                linkToken.level = token.level;
                newTokens.push(linkToken);

                if (strippedSuffix) {
                    const suffixToken = new Token("text", "", 0);
                    suffixToken.content = strippedSuffix;
                    suffixToken.level = token.level;
                    newTokens.push(suffixToken);
                }

                lastIndex = match.index + rawUrl.length;
            }

            if (lastIndex < content.length) {
                const textToken = new Token("text", "", 0);
                textToken.content = content.slice(lastIndex);
                textToken.level = token.level;
                newTokens.push(textToken);
            }

            if (newTokens.length > 0) {
                tokens.splice(i, 1, ...newTokens);
                i += newTokens.length - 1;
            }
        } else if (token.children) {
            processTokens(token.children);
        }
    }
}

export const linkPlugin = (md: MarkdownIt) => {
    md.core.ruler.after("inline", "link", (state) => {
        for (let i = 0; i < state.tokens.length; i++) {
            const token = state.tokens[i];
            if (token.type === "inline" && token.children) {
                processTokens(token.children);
            }
        }
    });
};
