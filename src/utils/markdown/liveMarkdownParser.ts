import type {
  MarkdownRange,
  MarkdownType,
} from "@expensify/react-native-live-markdown";
import emojiUnicodeRegex from "emojibase-regex";

const EMOJI_UNICODE_SOURCE = emojiUnicodeRegex.source;

type MarkerType = "bold" | "italic" | "strikethrough" | "code" | null;

const MARKERS: { symbol: string; type: MarkerType }[] = [
  { symbol: "**", type: "bold" },
  { symbol: "__", type: null },
  { symbol: "~~", type: "strikethrough" },
  { symbol: "`", type: "code" },
  { symbol: "||", type: null },
  { symbol: "*", type: "italic" },
  { symbol: "_", type: "italic" },
];

interface AtomicSpan {
  start: number;
  end: number;
  type: MarkdownType;
}

function findAtomicSpans(
  value: string,
  mentionEntities: { start: number; end: number }[],
): AtomicSpan[] {
  "worklet";
  const spans: AtomicSpan[] = [];

  const customEmojiRe = /<a?:[^:]+:\d+>/g;
  let m: RegExpExecArray | null;
  while ((m = customEmojiRe.exec(value))) {
    spans.push({ start: m.index, end: m.index + m[0].length, type: "emoji" });
  }

  for (const entity of mentionEntities) {
    spans.push({ start: entity.start, end: entity.end, type: "mention-user" });
  }

  const hereRe = /@everyone|@here/g;
  while ((m = hereRe.exec(value))) {
    spans.push({
      start: m.index,
      end: m.index + m[0].length,
      type: "mention-here",
    });
  }

  const emojiRe = new RegExp(EMOJI_UNICODE_SOURCE, "g");
  while ((m = emojiRe.exec(value))) {
    spans.push({ start: m.index, end: m.index + m[0].length, type: "emoji" });
  }

  spans.sort((a, b) => a.start - b.start);

  const merged: AtomicSpan[] = [];
  for (const span of spans) {
    const prev = merged[merged.length - 1];
    if (prev && span.start < prev.end) continue;
    merged.push(span);
  }

  return merged;
}

function scanMarkers(
  value: string,
  start: number,
  end: number,
  ranges: MarkdownRange[],
) {
  "worklet";
  const openIndex: Partial<Record<string, number>> = {};
  let i = start;

  while (i < end) {
    let matched: { symbol: string; type: MarkerType } | null = null;
    for (const marker of MARKERS) {
      if (value.startsWith(marker.symbol, i)) {
        matched = marker;
        break;
      }
    }

    if (!matched) {
      i += 1;
      continue;
    }

    const key = matched.symbol;
    const openAt = openIndex[key];

    if (openAt === undefined) {
      const closeIndex = value.indexOf(key, i + key.length);
      if (closeIndex === -1 || closeIndex >= end) {
        i += key.length;
        continue;
      }
      openIndex[key] = i;
      i += key.length;
      continue;
    }

    if (matched.type) {
      ranges.push({ type: "syntax", start: openAt, length: key.length });
      ranges.push({
        type: matched.type,
        start: openAt + key.length,
        length: i - (openAt + key.length),
      });
      ranges.push({ type: "syntax", start: i, length: key.length });
    }

    delete openIndex[key];
    i += key.length;
  }
}

export function liveMarkdownParser(
  value: string,
  mentionEntities: { start: number; end: number }[] = [],
): MarkdownRange[] {
  "worklet";
  const ranges: MarkdownRange[] = [];
  const atomicSpans = findAtomicSpans(value, mentionEntities);

  for (const span of atomicSpans) {
    ranges.push({
      type: span.type,
      start: span.start,
      length: span.end - span.start,
    });
  }

  let lineStart = 0;
  let atomicIdx = 0;

  for (let i = 0; i <= value.length; i++) {
    if (i !== value.length && value[i] !== "\n") continue;

    const lineEnd = i;
    const line = value.slice(lineStart, lineEnd);

    if (line.startsWith("> ")) {
      ranges.push({
        type: "blockquote",
        start: lineStart,
        length: line.length,
      });
    }

    let cursor = lineStart;
    while (
      atomicIdx < atomicSpans.length &&
      atomicSpans[atomicIdx].start < lineEnd
    ) {
      const span = atomicSpans[atomicIdx];
      if (span.start > cursor) scanMarkers(value, cursor, span.start, ranges);
      cursor = Math.max(cursor, span.end);
      if (span.end <= lineEnd) atomicIdx++;
      else break;
    }
    if (cursor < lineEnd) scanMarkers(value, cursor, lineEnd, ranges);

    lineStart = i + 1;
  }

  return ranges;
}
