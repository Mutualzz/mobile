import { renderBlocks } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer.helpers";
import { MarkdownRendererProps } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer.types";
import { customEmojiPlugin } from "@components/Markdown/MarkdownRenderer/plugins/customEmoji";
import { emojiPlugin } from "@components/Markdown/MarkdownRenderer/plugins/emoji";
import { emphasisPlugin } from "@components/Markdown/MarkdownRenderer/plugins/emphasis";
import { linkPlugin } from "@components/Markdown/MarkdownRenderer/plugins/links";
import { mentionPlugin } from "@components/Markdown/MarkdownRenderer/plugins/mention";
import { spoilerPlugin } from "@components/Markdown/MarkdownRenderer/plugins/spoiler";
import { strikethroughPlugin } from "@components/Markdown/MarkdownRenderer/plugins/strikethrough";
import { underlinePlugin } from "@components/Markdown/MarkdownRenderer/plugins/underline";
import { Paper } from "@components/Paper";
import { useTheme } from "@mutualzz/ui-native";
import { isEmojiOnlyMessage } from "@utils/emojis/isEmojiOnlyMessage";
import MarkdownIt from "markdown-it";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";

export const MarkdownRenderer = observer(
    ({
        color = "neutral",
        textColor = "primary",
        variant = "plain",
        enlargeEmojiOnly = true,
        spaceId,
        value,
        ...props
    }: MarkdownRendererProps) => {
        const { theme } = useTheme();

        const isEmojiOnly = useMemo(
            () => isEmojiOnlyMessage(value, enlargeEmojiOnly),
            [value, enlargeEmojiOnly],
        );

        const md = useMemo(() => {
            const instance = new MarkdownIt("default", {
                html: false,
                linkify: false,
                typographer: true,
                breaks: true,
            });

            instance.disable("emphasis");
            instance.disable("table");
            instance.disable("hr");
            instance.disable("escape");

            instance.use(emojiPlugin);
            instance.use(customEmojiPlugin);
            instance.use(mentionPlugin);
            instance.use(strikethroughPlugin);
            instance.use(emphasisPlugin);
            instance.use(underlinePlugin);
            instance.use(spoilerPlugin);
            instance.use(linkPlugin);

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
                {renderBlocks(
                    theme,
                    tokens,
                    isEmojiOnly,
                    spaceId,
                    textColor,
                )}
            </Paper>
        );
    },
);
