import { Paper } from "@components/Paper";
import { normalizeTypography } from "@mutualzz/ui-core";
import { PaperProps, Typography, useTheme } from "@mutualzz/ui-native";
import { applyEmojiTransforms } from "@utils/markdown/emojiTransforms";
import { makeTextMetrics } from "@utils/markdown/metrics";
import { tokenizeMarkdown } from "@utils/markdown/tokenize";
import { Selection } from "@utils/markdown/types";
import React, { useMemo, useRef } from "react";
import { Platform, TextInput, View } from "react-native";
import { renderToken } from "./MarkdownInput.helpers";

interface Props extends PaperProps {
    value: string;
    onChange: (next: string) => void;

    selection: Selection;
    onChangeSelection: (next: Selection) => void;

    enableEmoticons?: boolean;

    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;

    placeholder?: string;
}

export const MarkdownInput = ({
    value,
    onChange,
    selection,
    onChangeSelection,
    enableEmoticons = false,
    placeholder,

    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,

    ...props
}: Props) => {
    const { theme } = useTheme();
    const inputRef = useRef<TextInput>(null);

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
        [],
    );

    const selectionRef = useRef<Selection>(selection);
    selectionRef.current = selection;

    const tokens = useMemo(() => tokenizeMarkdown(value), [value]);

    const showPlaceholder = !value && !!placeholder;

    return (
        <Paper
            {...props}
            style={{
                flexDirection: "column",
                position: "relative",
                boxShadow: "none",
                ...(props.style as any),
            }}
        >
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
            />
        </Paper>
    );
};
