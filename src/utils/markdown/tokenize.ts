import { getEmoji } from "@utils/emojis";
import emojiRegex from "emojibase-regex";
import type { InlineFlags, LineKind, Token } from "./types";

const tokenDefs = [
    { symbol: "**", type: "bold" },
    { symbol: "*", type: "italic" },
    { symbol: "__", type: "underline" },
    { symbol: "~~", type: "strikethrough" },
    { symbol: "`", type: "code" },
    { symbol: "||", type: "spoiler" },
    { symbol: "_", type: "italic" },
] as const;

type TokenType = (typeof tokenDefs)[number]["type"];

const re = new RegExp(emojiRegex.source, "g");
const customEmojiRegex = /<a?:[^:]+:\d+>/g;

function splitCustomEmojiTokens(t: Token): Token[] {
    if (t.kind !== "text") return [t];

    const parts: Token[] = [];
    let last = 0;
    let m: RegExpExecArray | null;

    customEmojiRegex.lastIndex = 0;

    while ((m = customEmojiRegex.exec(t.text))) {
        const start = m.index;
        const match = m[0];
        const end = start + match.length;

        if (start > last) {
            parts.push({
                kind: "text",
                text: t.text.slice(last, start),
                flags: t.flags,
                lineKind: t.lineKind,
            });
        }

        parts.push({
            kind: "customEmoji",
            raw: match,
            flags: t.flags,
            lineKind: t.lineKind,
        });

        last = end;
    }

    if (last < t.text.length) {
        parts.push({
            kind: "text",
            text: t.text.slice(last),
            flags: t.flags,
            lineKind: t.lineKind,
        });
    }

    return parts.length > 0 ? parts : [t];
}

function splitEmojiTokens(t: Token): Token[] {
    if (t.kind !== "text") return [t];

    const parts: Token[] = [];

    let last = 0;
    let m: RegExpExecArray | null;

    while ((m = re.exec(t.text))) {
        const start = m.index;
        const match = m[0];
        const end = start + match.length;

        if (start > last) {
            parts.push({
                kind: "text",
                text: t.text.slice(last, start),
                flags: t.flags,
                lineKind: t.lineKind,
            });
        }

        const emoji = getEmoji(match);
        if (emoji) {
            parts.push({
                kind: "emoji",
                unicode: match,
                name: emoji.label,
                hexCode: emoji.hexcode.toLowerCase(),
                flags: t.flags,
                lineKind: t.lineKind,
            });
        } else {
            parts.push({
                kind: "text",
                text: match,
                flags: t.flags,
                lineKind: t.lineKind,
            });
        }

        last = end;
    }

    if (last < t.text.length) {
        parts.push({
            kind: "text",
            text: t.text.slice(last),
            flags: t.flags,
            lineKind: t.lineKind,
        });
    }

    return parts;
}

function getLineKindAndPrefix(line: string): {
    lineKind: LineKind;
    prefixLen: number;
} {
    if (line.startsWith("> ")) return { lineKind: "blockquote", prefixLen: 2 };

    return { lineKind: "normal", prefixLen: 0 };
}

function tokenizeMarkdownLine(
    originalLine: string,
    lineKind: LineKind,
    prefixLen: number,
): Token[] {
    const out: Token[] = [];

    const stacks: Record<TokenType, number> = {
        bold: 0,
        italic: 0,
        underline: 0,
        strikethrough: 0,
        code: 0,
        spoiler: 0,
    };

    const activeFlags = (): InlineFlags => {
        const flags: InlineFlags = {};
        (Object.keys(stacks) as TokenType[]).forEach((k) => {
            if (stacks[k] > 0) (flags as any)[k] = true;
        });
        return flags;
    };

    const pushText = (text: string, flags: InlineFlags) => {
        if (!text) return;
        out.push({ kind: "text", text, flags, lineKind });
    };

    let line = originalLine;
    if (prefixLen > 0) {
        pushText(line.slice(0, prefixLen), { isMarker: true });
        line = line.slice(prefixLen);
    }

    let i = 0;
    let lastTextStart = 0;

    const flushText = (end: number) => {
        if (end <= lastTextStart) return;
        pushText(line.slice(lastTextStart, end), activeFlags());
    };

    while (i < line.length) {
        const match = tokenDefs.find(({ symbol }) =>
            line.startsWith(symbol, i),
        );
        if (!match) {
            i += 1;
            continue;
        }

        const { symbol, type } = match;

        if (stacks[type] === 0) {
            const closeIdx = line.indexOf(symbol, i + symbol.length);
            if (closeIdx === -1) {
                flushText(i);
                pushText(symbol, activeFlags());
                i += symbol.length;
                lastTextStart = i;
                continue;
            }
        }

        flushText(i);
        pushText(symbol, { isMarker: true });

        stacks[type] = stacks[type] > 0 ? stacks[type] - 1 : stacks[type] + 1;

        i += symbol.length;
        lastTextStart = i;
    }

    flushText(line.length);
    return out;
}

export function tokenizeMarkdown(markdown: string): Token[] {
    const lines = markdown.split("\n");
    const out: Token[] = [];

    for (let li = 0; li < lines.length; li++) {
        const line = lines[li] ?? "";
        const { lineKind, prefixLen } = getLineKindAndPrefix(line);

        const lineTokens = tokenizeMarkdownLine(line, lineKind, prefixLen);

        for (const t of lineTokens) {
            for (const customToken of splitCustomEmojiTokens(t)) {
                out.push(...splitEmojiTokens(customToken));
            }
        }

        if (li !== lines.length - 1) out.push({ kind: "newline" });
    }

    return out;
}
