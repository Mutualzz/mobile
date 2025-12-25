import { renderBlocks } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer.helpers";
import { MarkdownRendererProps } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer.types";
import { emojiPlugin } from "@components/Markdown/MarkdownRenderer/plugins/emoji";
import { emphasisPlugin } from "@components/Markdown/MarkdownRenderer/plugins/emphasis";
import { spoilerPlugin } from "@components/Markdown/MarkdownRenderer/plugins/spoiler";
import { strikethroughPlugin } from "@components/Markdown/MarkdownRenderer/plugins/strikethrough";
import { underlinePlugin } from "@components/Markdown/MarkdownRenderer/plugins/underline";
import { Paper } from "@components/Paper";
import { useTheme } from "@mutualzz/ui-native";
import emojiRegexOrig from "emojibase-regex";
import shortcodeRegexOrig from "emojibase-regex/shortcode";
import MarkdownIt from "markdown-it";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";

const shortcodeRegex = new RegExp(shortcodeRegexOrig.source, "g");
const emojiRegex = new RegExp(emojiRegexOrig.source, "gu");

export const MarkdownRenderer = observer(
    ({
        color = "neutral",
        textColor = "primary",
        variant = "plain",
        enlargeEmojiOnly = true,
        value,
        ...props
    }: MarkdownRendererProps) => {
        const { theme } = useTheme();

        const isEmojiOnly = useMemo(() => {
            if (!value || !enlargeEmojiOnly) return false;

            const textWithoutEmojis = value
                .replace(shortcodeRegex, "")
                .replace(emojiRegex, "");

            return (
                textWithoutEmojis.trim().length === 0 && value.trim().length > 0
            );
        }, [value, enlargeEmojiOnly]);

        const md = useMemo(() => {
            const instance = new MarkdownIt("default", {
                html: false,
                linkify: true,
                typographer: true,
                breaks: true,
            });

            instance.disable("emphasis");
            instance.disable("table");
            instance.disable("hr");
            instance.disable("escape");

            instance.use(emojiPlugin);
            instance.use(strikethroughPlugin);
            instance.use(emphasisPlugin);
            instance.use(underlinePlugin);
            instance.use(spoilerPlugin);

            instance.linkify.set({
                fuzzyLink: false,
            });

            return instance;
        }, []);

        const tokens = useMemo(() => md.parse(value ?? "", {}), [md, value]);

        return (
            <Paper
                color={color}
                variant={variant}
                style={{
                    flexShrink: 1,
                }}
                {...props}
            >
                {renderBlocks(theme, tokens, isEmojiOnly)}
            </Paper>
        );
    },
);
