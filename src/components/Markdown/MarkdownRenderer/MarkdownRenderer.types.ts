import type {
    Color,
    ColorLike,
    TypographyColor,
    Variant,
} from "@mutualzz/ui-core";
import type { Snowflake } from "@mutualzz/types";

export interface MarkdownRendererProps {
    value: string;
    spaceId?: Snowflake | null;

    color?: Color | ColorLike;
    textColor?: TypographyColor | ColorLike | "inherit";
    variant?: Variant;

    enlargeEmojiOnly?: boolean;
}
