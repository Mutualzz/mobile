import type { BaseEditor, BaseRange, Descendant } from "slate";
import { type HistoryEditor } from "slate-history";
import { type ReactEditor } from "slate-react";

export interface BlockQuoteElement {
    type: "blockquote";
    children: Descendant[];
}

export interface LineElement {
    type: "line";
    children: Descendant[];
}

export interface HeadingElement {
    type: "heading";
    level: 1 | 2 | 3;
    children: Descendant[];
}

export interface LinkElement {
    type: "link";
    url: string;
    children: Descendant[];
}

export interface EmojiElement {
    type: "emoji";
    url: string;
    unicode: string;
    name: string;
    children: EmptyText[];
}

export interface Text {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    spoiler?: boolean;
    isMarker?: boolean; // Used to mark ranges for markers like **bold** or *italic*
    text: string;
}

export interface EmptyText {
    text: string;
}

export type FormatKey = keyof Omit<Text, "text" | "isMarker"> | "blockquote";

export type Element =
    | BlockQuoteElement
    | LineElement
    | HeadingElement
    | EmojiElement
    | LinkElement;

export type Editor = BaseEditor &
    ReactEditor &
    HistoryEditor & {
        enableEmoticons?: boolean;
    };

declare module "slate" {
    interface CustomTypes {
        Editor: Editor;
        Element: Element;
        Text: Text;
        Range: BaseRange & Record<string, any>;
    }
}
