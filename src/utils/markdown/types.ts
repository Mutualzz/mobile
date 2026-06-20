export type Selection = { start: number; end: number };

export type InlineFlags = Partial<{
    bold: true;
    italic: true;
    underline: true;
    strikethrough: true;
    code: true;
    spoiler: true;
    isMarker: true;
}>;

export type LineKind = "normal" | "blockquote";

export type Token =
    | {
          kind: "text";
          text: string;
          flags: InlineFlags;
          lineKind: LineKind;
      }
    | {
          kind: "emoji";
          unicode: string;
          name?: string;
          hexCode?: string;
          flags: InlineFlags;
          lineKind: LineKind;
      }
    | {
          kind: "customEmoji";
          raw: string;
          flags: InlineFlags;
          lineKind: LineKind;
      }
    | { kind: "newline" };
