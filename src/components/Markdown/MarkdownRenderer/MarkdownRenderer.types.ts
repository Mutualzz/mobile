import type {
    Color,
    ColorLike,
    TypographyColor,
    Variant,
} from "@mutualzz/ui-core";

export interface MarkdownRendererProps {
    value: string;

    color?: Color | ColorLike;
    textColor?: TypographyColor | ColorLike | "inherit";
    variant?: Variant;

    enlargeEmojiOnly?: boolean;
}
