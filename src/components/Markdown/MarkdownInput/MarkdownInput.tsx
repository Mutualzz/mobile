import { Paper } from "@components/Paper";
import { EmojiAutocomplete } from "@components/Markdown/MarkdownInput/EmojiAutocomplete";
import { MentionAutocomplete } from "@components/Markdown/MarkdownInput/MentionAutocomplete";
import { useAppStore } from "@hooks/useStores";
import { normalizeTypography } from "@mutualzz/ui-core";
import type { MentionType, Snowflake } from "@mutualzz/types";
import { ExpressionType } from "@mutualzz/types";
import { type PaperProps, Typography, useTheme } from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import { canUseCustomEmoji } from "@utils/expressions";
import {
    detectColonQuery,
    detectMentionQuery,
    formatCustomEmojiMarkdown,
    formatMentionMarkdown,
} from "@utils/markdown/composerQueries";
import { applyEmojiTransforms } from "@utils/markdown/emojiTransforms";
import { makeTextMetrics } from "@utils/markdown/metrics";
import { replaceRange } from "@utils/markdown/textUtils";
import { tokenizeMarkdown } from "@utils/markdown/tokenize";
import { type Selection } from "@utils/markdown/types";
import type { Emoji } from "emojibase";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { Platform, TextInput, View } from "react-native";
import { renderToken } from "./MarkdownInput.helpers";

interface Props extends Omit<PaperProps, "onChange"> {
    value: string;
    onChange: (next: string) => void;

    selection: Selection;
    onChangeSelection: (next: Selection) => void;

    channelId?: Snowflake;
    enableEmoticons?: boolean;
    enableMentions?: boolean;
    enableEmojiAutocomplete?: boolean;

    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;

    placeholder?: string;
    editable?: boolean;
    endAdornment?: ReactNode;
}

export const MarkdownInput = observer(
    ({
        value,
        onChange,
        selection,
        onChangeSelection,
        channelId,
        enableEmoticons = false,
        enableMentions = true,
        enableEmojiAutocomplete = true,
        placeholder,
        editable = true,
        endAdornment,

        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,

        ...props
    }: Props) => {
        const app = useAppStore();
        const { theme } = useTheme();
        const inputRef = useRef<TextInput>(null);

        const channel = channelId ? app.channels.get(channelId) : null;

        const metrics = useMemo(
            () =>
                makeTextMetrics({
                    ...normalizeTypography(theme.typography.levels["body-md"]),
                    fontFamily: theme.typography.fontFamily,
                    paddingLeft,
                    paddingRight,
                    paddingTop,
                    paddingBottom,
                }),
            [
                paddingBottom,
                paddingLeft,
                paddingRight,
                paddingTop,
                theme.typography.fontFamily,
                theme.typography.levels,
            ],
        );

        const selectionRef = useRef<Selection>(selection);
        selectionRef.current = selection;

        const tokens = useMemo(() => tokenizeMarkdown(value), [value]);

        const showPlaceholder = !value && !!placeholder;

        const mentionQuery = useMemo(() => {
            if (!enableMentions || !channel) return null;
            return detectMentionQuery(value, selection);
        }, [channel, enableMentions, selection, value]);

        const colonQuery = useMemo(() => {
            if (!enableEmojiAutocomplete || mentionQuery) return null;
            return detectColonQuery(value, selection);
        }, [enableEmojiAutocomplete, mentionQuery, selection, value]);

        const resolveCustomEmojiByName = useCallback(
            (name: string) => {
                if (!channel) return null;

                const me = channel.spaceId
                    ? app.spaces.get(channel.spaceId)?.members.me
                    : null;
                const lowerName = name.toLowerCase();

                return (
                    app.expressions.all.find(
                        (exp) =>
                            exp.type === ExpressionType.Emoji &&
                            exp.name.toLowerCase() === lowerName &&
                            canUseCustomEmoji(
                                app.account?.id || "",
                                exp,
                                me,
                                channel,
                            ),
                    ) ?? null
                );
            },
            [app.account?.id, app.expressions.all, app.spaces, channel],
        );

        const applyReplacement = useCallback(
            (start: number, end: number, insert: string, trailingSpace = true) => {
                const replacement = trailingSpace ? `${insert} ` : insert;
                const rep = replaceRange(value, start, end, replacement);
                const caret = start + replacement.length;

                onChange(rep.text);
                onChangeSelection({ start: caret, end: caret });
            },
            [onChange, onChangeSelection, value],
        );

        const handleMentionSelect = useCallback(
            (type: MentionType, id: string) => {
                if (!mentionQuery) return;
                applyReplacement(
                    mentionQuery.start,
                    mentionQuery.end,
                    formatMentionMarkdown(type, id),
                );
            },
            [applyReplacement, mentionQuery],
        );

        const handleStandardEmojiSelect = useCallback(
            (emoji: Emoji) => {
                if (!colonQuery) return;
                applyReplacement(
                    colonQuery.start,
                    colonQuery.end,
                    emoji.emoji,
                    true,
                );
            },
            [applyReplacement, colonQuery],
        );

        const handleCustomEmojiSelect = useCallback(
            (expression: Expression) => {
                if (!colonQuery) return;
                applyReplacement(
                    colonQuery.start,
                    colonQuery.end,
                    formatCustomEmojiMarkdown(expression),
                    true,
                );
            },
            [applyReplacement, colonQuery],
        );

        return (
            <Paper
                {...props}
                style={{
                    flexDirection: "column",
                    position: "relative",
                    ...(props.style as object),
                }}
            >
                {mentionQuery && channel ? (
                    <MentionAutocomplete
                        channel={channel}
                        search={mentionQuery.search}
                        onSelect={handleMentionSelect}
                    />
                ) : null}

                {colonQuery && channel ? (
                    <EmojiAutocomplete
                        channel={channel}
                        search={colonQuery.search}
                        onSelectStandard={handleStandardEmojiSelect}
                        onSelectCustom={handleCustomEmojiSelect}
                    />
                ) : null}

                <View
                    pointerEvents="none"
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                    }}
                >
                    <Typography
                        allowFontScaling={false}
                        style={metrics}
                        textColor={showPlaceholder ? "muted" : undefined}
                    >
                        {showPlaceholder
                            ? placeholder
                            : tokens.map((t, idx) => renderToken(theme, t, idx))}
                    </Typography>
                </View>

                <TextInput
                    ref={inputRef}
                    multiline
                    value={value}
                    onChangeText={(next) => {
                        let nextText = next;
                        let nextSel = selectionRef.current;

                        const delta = nextText.length - value.length;

                        if (nextSel.start === nextSel.end && delta > 0) {
                            const caret = nextSel.start;
                            nextSel = { start: caret + delta, end: caret + delta };

                            const out = applyEmojiTransforms(nextText, nextSel, {
                                enableEmoticons,
                                resolveCustomEmojiByName,
                            });

                            if (out.didTransform) {
                                nextText = out.text;
                                nextSel = out.selection;
                                onChangeSelection(nextSel);
                            }
                        }

                        onChange(nextText);
                    }}
                    selection={selection}
                    onSelectionChange={(e) => {
                        const { start, end } = e.nativeEvent.selection;
                        onChangeSelection({ start, end });
                    }}
                    style={{
                        ...(Platform.OS === "ios"
                            ? { color: "transparent" }
                            : { opacity: 0.01 }),

                        ...metrics,
                    }}
                    placeholder=""
                    autoCorrect
                    editable={editable}
                />

                {endAdornment ? (
                    <View
                        pointerEvents="box-none"
                        style={{
                            position: "absolute",
                            right: 10,
                            top: 0,
                            bottom: 0,
                            justifyContent: "center",
                        }}
                    >
                        {endAdornment}
                    </View>
                ) : null}
            </Paper>
        );
    },
);
