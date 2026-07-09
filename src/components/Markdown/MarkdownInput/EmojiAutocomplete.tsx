import { UnicodeEmoji } from "@components/emojis/UnicodeEmoji";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { ExpressionType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { Expression } from "@stores/objects/Expression";
import {
  buildDeduplicatedEmojiLabels,
  canUseCustomEmoji,
} from "@utils/expressions";
import { searchShortcodeEmojis } from "@utils/emojis";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useScaledAutocompleteMaxHeight, useScaledSquareSize } from "@utils/accessibilityLayout";
import { Image, Pressable, ScrollView } from "react-native";
import type { Emoji } from "emojibase";

const MIN_QUERY_LENGTH = 2;
const MAX_CUSTOM = 7;
const MAX_STANDARD = 7;

interface StandardSuggestion {
  kind: "standard";
  key: string;
  label: string;
  emoji: Emoji;
}

interface CustomSuggestion {
  kind: "custom";
  key: string;
  label: string;
  name: string;
  expression: Expression;
}

interface Props {
  channel?: Channel;
  search: string;
  onSelectStandard: (emoji: Emoji) => void;
  onSelectCustom: (expression: Expression, name: string) => void;
}

export const EmojiAutocomplete = observer(
  ({ channel, search, onSelectStandard, onSelectCustom }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const autocompleteMaxHeight = useScaledAutocompleteMaxHeight();
    const emojiSize = useScaledSquareSize(22);

    const suggestions = useMemo(() => {
      if (search.length < MIN_QUERY_LENGTH) return [];

      const lowerQuery = search.toLowerCase();
      const me = channel?.spaceId
        ? app.spaces.get(channel.spaceId)?.members.me
        : null;

      const allCustomEmojis = app.expressions.all.filter(
        (exp) =>
          exp.type === ExpressionType.Emoji &&
          canUseCustomEmoji(app.account?.id || "", exp, me, channel),
      );

      const deduplicatedLabels = buildDeduplicatedEmojiLabels(allCustomEmojis);

      const customResults: CustomSuggestion[] = [];
      const seenIds = new Set<string>();

      for (const exp of allCustomEmojis) {
        if (customResults.length >= MAX_CUSTOM) break;
        if (seenIds.has(exp.id)) continue;

        const displayName = deduplicatedLabels.get(exp) ?? exp.name;
        const matchesQuery =
          exp.name.toLowerCase().includes(lowerQuery) ||
          displayName.toLowerCase().includes(lowerQuery);

        if (!matchesQuery) continue;

        seenIds.add(exp.id);
        customResults.push({
          kind: "custom",
          key: `custom-${exp.id}`,
          label: `:${displayName}:`,
          name: displayName,
          expression: exp,
        });
      }

      const standardResults: StandardSuggestion[] = searchShortcodeEmojis(
        search,
        MAX_STANDARD,
      ).map((emoji) => ({
        kind: "standard" as const,
        key: `standard-${emoji.hexcode}`,
        label: `:${emoji.shortcodes?.[0] ?? emoji.label}:`,
        emoji,
      }));

      return [...customResults, ...standardResults].slice(
        0,
        MAX_CUSTOM + MAX_STANDARD,
      );
    }, [app.account?.id, app.expressions.all, channel, search]);

    if (suggestions.length === 0) return null;

    return (
      <Paper
        elevation={4}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "100%",
          marginBottom: 6,
          maxHeight: autocompleteMaxHeight,
          zIndex: 20,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <Box style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}>
          <Typography level="body-xs" textColor="muted">
            Emojis matching &quot;:{search}:&quot;
          </Typography>
        </Box>
        <ScrollView keyboardShouldPersistTaps="handled">
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion.key}
              onPress={() => {
                if (suggestion.kind === "standard") {
                  onSelectStandard(suggestion.emoji);
                  return;
                }

                onSelectCustom(suggestion.expression, suggestion.name);
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: pressed
                  ? `${theme.colors.neutral}22`
                  : "transparent",
              })}
            >
              {suggestion.kind === "standard" ? (
                <UnicodeEmoji value={suggestion.emoji.emoji} size={emojiSize} />
              ) : (
                <Image
                  source={{ uri: suggestion.expression.url }}
                  style={{ width: emojiSize, height: emojiSize }}
                  resizeMode="contain"
                />
              )}
              <Typography level="body-sm" style={{ flex: 1 }} truncate="single">
                {suggestion.label}
              </Typography>
            </Pressable>
          ))}
        </ScrollView>
      </Paper>
    );
  },
);
