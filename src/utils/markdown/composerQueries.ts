import type { MentionType } from "@mutualzz/types";
import type { Expression } from "@stores/objects/Expression";
import type { Selection } from "./types";

export type ActiveQuery = {
    start: number;
    end: number;
    search: string;
};

const MENTION_BREAK = /[\s*_`~|]/;
const COLON_QUERY = /:([^\s:]{1,})$/;

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
