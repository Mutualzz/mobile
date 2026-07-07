import type { MentionType } from "@mutualzz/types";
import type { Expression } from "@stores/objects/Expression";
import type { Selection } from "./types";

export interface ActiveQuery {
  start: number;
  end: number;
  search: string;
}

const MENTION_BREAK = /[\s*_`~|]/;
const COLON_QUERY = /:([^\s:]{1,})$/;
const CUSTOM_EMOJI_MARKDOWN = /<a?:[^:]+:\d+>/g;
const CUSTOM_EMOJI_SHORTCODE = /:([^\s:]+):/g;

export function detectMentionQuery(
  text: string,
  selection: Selection,
): ActiveQuery | null {
  if (selection.start !== selection.end) return null;

  const caret = selection.start;
  let beforeIndex = caret - 1;

  while (beforeIndex >= 0) {
    const char = text[beforeIndex];
    if (char === "@") {
      const search = text.substring(beforeIndex + 1, caret);
      if (/\s/.test(search)) return null;

      return {
        start: beforeIndex,
        end: caret,
        search,
      };
    }

    if (MENTION_BREAK.test(char)) break;
    beforeIndex--;
  }

  return null;
}

export function detectColonQuery(
  text: string,
  selection: Selection,
): ActiveQuery | null {
  if (selection.start !== selection.end) return null;

  const caret = selection.start;
  const before = text.slice(0, caret);
  const match = COLON_QUERY.exec(before);
  if (!match) return null;

  return {
    start: match.index,
    end: caret,
    search: match[1] ?? "",
  };
}

export function formatMentionMarkdown(type: MentionType, id: string): string {
  if (type === "role") return `<@&${id}>`;
  if (type === "everyone") return "@everyone";
  if (type === "here") return "@here";
  return `<@${id}>`;
}

export function formatCustomEmojiMarkdown(expression: Expression): string {
  const prefix = expression.animated ? "a" : "";
  return `<${prefix}:${expression.name}:${expression.id}>`;
}

export function expandCustomEmojiShortcodes(
  text: string,
  resolve: (name: string) => Expression | null | undefined,
): string {
  CUSTOM_EMOJI_MARKDOWN.lastIndex = 0;
  const excludedRanges: [number, number][] = [];
  let excludedMatch: RegExpExecArray | null;
  while ((excludedMatch = CUSTOM_EMOJI_MARKDOWN.exec(text))) {
    excludedRanges.push([
      excludedMatch.index,
      excludedMatch.index + excludedMatch[0].length,
    ]);
  }

  CUSTOM_EMOJI_SHORTCODE.lastIndex = 0;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CUSTOM_EMOJI_SHORTCODE.exec(text))) {
    const isExcluded = excludedRanges.some(
      ([start, end]) => match!.index >= start && match!.index < end,
    );
    if (isExcluded) continue;

    const expression = resolve(match[1]);
    if (!expression) continue;

    result += text.slice(lastIndex, match.index);
    result += formatCustomEmojiMarkdown(expression);
    lastIndex = match.index + match[0].length;
  }

  result += text.slice(lastIndex);
  return result;
}
