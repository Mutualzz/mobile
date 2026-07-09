import Token from "markdown-it/lib/token.mjs";

/**
 * Splits "text" children matching `regex` (which must have exactly one
 * capture group for the inner content) into `{tokenType}_open`, a plain
 * "text" token holding the captured content, and `{tokenType}_close`.
 * Keeping the inner content as an ordinary "text" token (rather than a
 * single leaf token holding the whole match) lets later inline plugins
 * (mentions, custom emoji, links, ...) keep finding and resolving content
 * nested inside formatting like bold/italic/underline/spoiler.
 */
export function splitByMarker(
  children: Token[],
  regex: RegExp,
  tokenType: string,
) {
  for (let j = 0; j < children.length; j++) {
    const token = children[j];
    if (token.type !== "text") continue;

    regex.lastIndex = 0;
    if (!regex.test(token.content)) continue;
    regex.lastIndex = 0;

    const content = token.content;
    const newTokens: Token[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content))) {
      if (match.index > lastIndex) {
        const textToken = new Token("text", "", 0);
        textToken.content = content.slice(lastIndex, match.index);
        textToken.level = token.level;
        newTokens.push(textToken);
      }

      const openToken = new Token(`${tokenType}_open`, "", 0);
      openToken.level = token.level;
      newTokens.push(openToken);

      const innerToken = new Token("text", "", 0);
      innerToken.content = match[1];
      innerToken.level = token.level;
      newTokens.push(innerToken);

      const closeToken = new Token(`${tokenType}_close`, "", 0);
      closeToken.level = token.level;
      newTokens.push(closeToken);

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
