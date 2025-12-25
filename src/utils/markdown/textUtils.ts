import type { Selection } from "./types";

export function clampSelection(text: string, sel: Selection): Selection {
    const s = Math.max(0, Math.min(sel.start, text.length));
    const e = Math.max(0, Math.min(sel.end, text.length));
    return { start: s, end: e };
}

export function replaceRange(
    text: string,
    start: number,
    end: number,
    insert: string,
): { text: string; delta: number } {
    const s = Math.max(0, Math.min(start, text.length));
    const e = Math.max(s, Math.min(end, text.length));
    const next = text.slice(0, s) + insert + text.slice(e);
    return { text: next, delta: insert.length - (e - s) };
}

export function lineStartIndex(text: string, caret: number): number {
    const i = Math.max(0, Math.min(caret, text.length));
    const nl = text.lastIndexOf("\n", i - 1);
    return nl === -1 ? 0 : nl + 1;
}

export function lineEndIndex(text: string, caret: number): number {
    const i = Math.max(0, Math.min(caret, text.length));
    const nl = text.indexOf("\n", i);
    return nl === -1 ? text.length : nl;
}

export function getLineSlice(
    text: string,
    caret: number,
): { start: number; end: number; line: string } {
    const start = lineStartIndex(text, caret);
    const end = lineEndIndex(text, caret);
    return { start, end, line: text.slice(start, end) };
}
