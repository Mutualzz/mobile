import { Paper } from "@components/Paper";
import { EmojiAutocomplete } from "@components/Markdown/MarkdownInput/EmojiAutocomplete";
import { MentionAutocomplete } from "@components/Markdown/MarkdownInput/MentionAutocomplete";
import { useAppStore } from "@hooks/useStores";
import type {
  MarkdownStyle,
  MarkdownTextInputProps,
} from "@expensify/react-native-live-markdown";
import { normalizeTypography } from "@mutualzz/ui-core";
import type { MentionType, Snowflake } from "@mutualzz/types";
import { type PaperProps, MAX_FONT_SCALE_MULTIPLIER, useFontScale, useTheme } from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import {
  detectColonQuery,
  detectMentionQuery,
  formatMentionMarkdown,
} from "@utils/markdown/composerQueries";
import { applyEmojiTransforms } from "@utils/markdown/emojiTransforms";
import { liveMarkdownParser } from "@utils/markdown/liveMarkdownParser";
import {
  shiftEntitiesForEdit,
  type MentionEntity,
} from "@utils/markdown/mentionEntities";
import { makeTextMetrics } from "@utils/markdown/metrics";
import { replaceRange } from "@utils/markdown/textUtils";
import { type Selection } from "@utils/markdown/types";
import type { Emoji } from "emojibase";
import { observer } from "mobx-react-lite";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from "react";
import { View, type TextInput } from "react-native";

type MarkdownTextInputComponent = ForwardRefExoticComponent<
  MarkdownTextInputProps & RefAttributes<TextInput>
>;

const MarkdownTextInput: MarkdownTextInputComponent =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@expensify/react-native-live-markdown/src/MarkdownTextInput").default;

interface Props extends Omit<PaperProps, "onChange"> {
  value: string;
  onChange: (next: string) => void;

  selection: Selection;
  onChangeSelection: (next: Selection) => void;

  entities?: MentionEntity[];
  onChangeEntities?: (next: MentionEntity[]) => void;

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
  nativeID?: string;
}

export const MarkdownInput = observer(
  ({
    value,
    onChange,
    selection,
    onChangeSelection,
    entities: controlledEntities,
    onChangeEntities: controlledOnChangeEntities,
    channelId,
    enableEmoticons: enableEmoticonsProp,
    enableMentions = true,
    enableEmojiAutocomplete = true,
    placeholder,
    editable = true,
    endAdornment,
    nativeID,

    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,

    ...props
  }: Props) => {
    const app = useAppStore();
    const enableEmoticons =
      enableEmoticonsProp ?? app.settings?.extended.convertEmoticons ?? true;
    const { theme } = useTheme();
    const fontScale = useFontScale();
    const inputRef = useRef<TextInput>(null);

    const [uncontrolledEntities, setUncontrolledEntities] = useState<
      MentionEntity[]
    >([]);
    const entities = controlledEntities ?? uncontrolledEntities;
    const onChangeEntities =
      controlledOnChangeEntities ?? setUncontrolledEntities;

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
        fontScale,
      ],
    );

    const markdownStyle: MarkdownStyle = useMemo(
      () => ({
        syntax: { color: theme.typography.colors.muted },
        link: { color: theme.colors.info },
        emoji: { fontSize: metrics.fontSize, fontFamily: metrics.fontFamily },
        mentionUser: {
          color: theme.colors.primary,
          backgroundColor: `${theme.colors.primary}18`,
        },
        mentionHere: {
          color: theme.colors.primary,
          backgroundColor: `${theme.colors.primary}18`,
        },
        mentionReport: {
          color: theme.colors.primary,
          backgroundColor: `${theme.colors.primary}18`,
        },
        code: {
          fontFamily: "monospace",
          fontSize: metrics.fontSize,
          color: theme.typography.colors.primary,
          backgroundColor: `${theme.typography.colors.muted}22`,
        },
        pre: {
          fontFamily: "monospace",
          fontSize: metrics.fontSize,
          color: theme.typography.colors.primary,
          backgroundColor: `${theme.typography.colors.muted}22`,
        },
        h1: { fontSize: metrics.fontSize ? metrics.fontSize * 1.3 : 20 },
        blockquote: {
          borderColor: theme.typography.colors.muted,
          borderWidth: 2,
          marginLeft: 6,
          paddingLeft: 8,
        },
      }),
      [
        metrics.fontFamily,
        metrics.fontSize,
        theme.colors.info,
        theme.colors.primary,
        theme.typography.colors.muted,
        theme.typography.colors.primary,
      ],
    );

    const selectionRef = useRef<Selection>(selection);
    selectionRef.current = selection;

    const showPlaceholder = !value && !!placeholder;

    const mentionQuery = useMemo(() => {
      if (!enableMentions || !channel) return null;
      return detectMentionQuery(value, selection);
    }, [channel, enableMentions, selection, value]);

    const colonQuery = useMemo(() => {
      if (!enableEmojiAutocomplete || mentionQuery) return null;
      return detectColonQuery(value, selection);
    }, [enableEmojiAutocomplete, mentionQuery, selection, value]);

    const parser = useCallback(
      (text: string) => {
        "worklet";
        return liveMarkdownParser(text, entities);
      },
      [entities],
    );

    const applyReplacement = useCallback(
      (
        start: number,
        end: number,
        insert: string,
        trailingSpace = true,
        entity?: { type: MentionEntity["type"]; id: string },
      ) => {
        const replacement = trailingSpace ? `${insert} ` : insert;
        const rep = replaceRange(value, start, end, replacement);
        const caret = start + replacement.length;

        let nextEntities = shiftEntitiesForEdit(entities, value, rep.text);
        if (entity) {
          nextEntities = [
            ...nextEntities,
            { start, end: start + insert.length, ...entity },
          ];
        }

        onChange(rep.text);
        onChangeEntities(nextEntities);
        onChangeSelection({ start: caret, end: caret });

        requestAnimationFrame(() => {
          inputRef.current?.setSelection(caret, caret);
        });
      },
      [entities, onChange, onChangeEntities, onChangeSelection, value],
    );

    const handleMentionSelect = useCallback(
      (type: MentionType, id: string, label: string) => {
        if (!mentionQuery) return;

        if (type === "user" || type === "role") {
          applyReplacement(
            mentionQuery.start,
            mentionQuery.end,
            `@${label}`,
            true,
            { type, id },
          );
          return;
        }

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
        applyReplacement(colonQuery.start, colonQuery.end, emoji.emoji, true);
      },
      [applyReplacement, colonQuery],
    );

    const handleCustomEmojiSelect = useCallback(
      (_expression: Expression, name: string) => {
        if (!colonQuery) return;
        applyReplacement(colonQuery.start, colonQuery.end, `:${name}:`, true);
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
        {mentionQuery && channel && (
          <MentionAutocomplete
            channel={channel}
            search={mentionQuery.search}
            onSelect={handleMentionSelect}
          />
        )}

        {colonQuery && (
          <EmojiAutocomplete
            channel={channel ?? undefined}
            search={colonQuery.search}
            onSelectStandard={handleStandardEmojiSelect}
            onSelectCustom={handleCustomEmojiSelect}
          />
        )}

        <MarkdownTextInput
          ref={inputRef}
          nativeID={nativeID}
          multiline
          blurOnSubmit={false}
          allowFontScaling
          maxFontSizeMultiplier={MAX_FONT_SCALE_MULTIPLIER}
          value={value}
          parser={parser}
          markdownStyle={markdownStyle}
          onChangeText={(next) => {
            const prevValue = value;

            let nextText = next;
            let nextSel = selectionRef.current;
            let nextEntities = shiftEntitiesForEdit(entities, prevValue, next);

            const delta = nextText.length - value.length;

            if (nextSel.start === nextSel.end && delta > 0) {
              const caret = nextSel.start;
              nextSel = {
                start: caret + delta,
                end: caret + delta,
              };

              const out = applyEmojiTransforms(nextText, nextSel, {
                enableEmoticons,
              });

              if (out.didTransform) {
                nextEntities = shiftEntitiesForEdit(
                  nextEntities,
                  nextText,
                  out.text,
                );
                nextText = out.text;
                nextSel = out.selection;
                onChangeSelection(nextSel);
              }
            }

            onChange(nextText);
            onChangeEntities(nextEntities);
          }}
          selection={selection}
          onSelectionChange={(e) => {
            const { start, end } = e.nativeEvent.selection;
            onChangeSelection({ start, end });
          }}
          placeholder={placeholder}
          placeholderTextColor={
            showPlaceholder ? theme.typography.colors.muted : undefined
          }
          style={{
            flexGrow: 1,
            alignSelf: "stretch",
            width: "100%",
            color: theme.typography.colors.primary,
            ...metrics,
          }}
          autoCorrect
          editable={editable}
        />

        {endAdornment && (
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
        )}
      </Paper>
    );
  },
);
