import type MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";
import { resolveMarkdownTextColor } from "@mutualzz/validators";

const COLOR_RE = /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi;
const COLOR_CLOSE = "[/color]";

type CharMap = { tokenIndex: number; offset: number };

const isBreak = (token: Token) =>
  token.type === "softbreak" || token.type === "hardbreak";

function buildSearch(children: Token[]) {
  let search = "";
  const map: CharMap[] = [];

  for (let tokenIndex = 0; tokenIndex < children.length; tokenIndex++) {
    const token = children[tokenIndex];

    if (token.type === "text") {
      for (let offset = 0; offset < token.content.length; offset++) {
        map.push({ tokenIndex, offset });
        search += token.content[offset];
      }
      continue;
    }

    if (isBreak(token)) {
      map.push({ tokenIndex, offset: 0 });
      search += "\n";
    }
  }

  return { search, map };
}

function cloneText(token: Token, content: string) {
  const next = new Token("text", "", 0);
  next.content = content;
  next.level = token.level;
  return next;
}

function processColor(children: Token[]) {
  const { search, map } = buildSearch(children);
  if (!search.includes("[color=")) return;

  const matches: {
    start: number;
    openEnd: number;
    closeStart: number;
    end: number;
    color: string;
  }[] = [];

  COLOR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = COLOR_RE.exec(search))) {
    const resolved = resolveMarkdownTextColor(match[1]);
    if (!resolved) continue;

    const start = match.index;
    const openEnd =
      start + match[0].length - match[2].length - COLOR_CLOSE.length;
    const closeStart = openEnd + match[2].length;
    const end = closeStart + COLOR_CLOSE.length;

    matches.push({ start, openEnd, closeStart, end, color: resolved });
  }

  if (matches.length === 0) return;

  const next: Token[] = [];
  let matchIdx = 0;
  let i = 0;

  while (i < children.length) {
    const active = matches[matchIdx];
    if (!active) {
      next.push(children[i]);
      i += 1;
      continue;
    }

    const openMap = map[active.start];
    const closeMap = map[active.closeStart];

    if (i < openMap.tokenIndex) {
      next.push(children[i]);
      i += 1;
      continue;
    }

    if (i === openMap.tokenIndex) {
      const openToken = children[i];
      if (openToken.type === "text" && openMap.offset > 0) {
        next.push(
          cloneText(openToken, openToken.content.slice(0, openMap.offset))
        );
      }

      const colorOpen = new Token("color_open", "", 1);
      colorOpen.level = openToken.level;
      colorOpen.attrSet("color", active.color);
      next.push(colorOpen);

      const openEndMap = map[active.openEnd - 1];
      const afterOpenOffset = openEndMap.offset + 1;

      if (openMap.tokenIndex === closeMap.tokenIndex) {
        const inner = openToken.content.slice(afterOpenOffset, closeMap.offset);
        if (inner) next.push(cloneText(openToken, inner));

        const colorClose = new Token("color_close", "", -1);
        colorClose.level = openToken.level;
        next.push(colorClose);

        const afterClose = openToken.content.slice(
          closeMap.offset + COLOR_CLOSE.length
        );
        if (afterClose) next.push(cloneText(openToken, afterClose));

        i += 1;
        matchIdx += 1;
        continue;
      }

      const afterOpen = openToken.content.slice(afterOpenOffset);
      if (afterOpen) next.push(cloneText(openToken, afterOpen));
      i += 1;

      while (i < closeMap.tokenIndex) {
        next.push(children[i]);
        i += 1;
      }

      const closeToken = children[i];
      if (closeToken.type === "text") {
        const beforeClose = closeToken.content.slice(0, closeMap.offset);
        if (beforeClose) next.push(cloneText(closeToken, beforeClose));

        const colorClose = new Token("color_close", "", -1);
        colorClose.level = closeToken.level;
        next.push(colorClose);

        const afterClose = closeToken.content.slice(
          closeMap.offset + COLOR_CLOSE.length
        );
        if (afterClose) next.push(cloneText(closeToken, afterClose));
      } else {
        const colorClose = new Token("color_close", "", -1);
        colorClose.level = closeToken.level;
        next.push(colorClose);
        next.push(closeToken);
      }

      i += 1;
      matchIdx += 1;
      continue;
    }

    next.push(children[i]);
    i += 1;
  }

  children.splice(0, children.length, ...next);
}

export const colorPlugin = (md: MarkdownIt) => {
  md.core.ruler.after("inline", "color", (state) => {
    for (const token of state.tokens) {
      const children = token.children;
      if (token.type !== "inline" || !children) continue;
      processColor(children);
    }
  });
};
