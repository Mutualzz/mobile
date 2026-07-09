import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Message } from "@stores/objects/Message";
import { getEmoji } from "@utils/emojis";
import { useScaledReactionChipStyle } from "@utils/accessibilityLayout";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";
import { MessageReactionEmoji } from "./MessageReactionEmoji";

interface Props {
  message: Message;
}

export const MessageReactions = observer(({ message }: Props) => {
  const app = useAppStore();
  const chipStyle = useScaledReactionChipStyle();

  if (message.editing) return null;

  return (
    <Box
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 4,
      }}
    >
      {message.reactions.map((reaction) => {
        const emojiName =
          reaction.emoji.type === "unicode"
            ? (getEmoji(reaction.emoji.value)?.shortcodes?.[0] ??
              reaction.emoji.value)
            : (app.expressions.get(reaction.emoji.expression.id)?.name ??
              "custom emoji");

        return (
          <Pressable
            key={
              reaction.emoji.type === "unicode"
                ? reaction.emoji.value
                : reaction.emoji.expression.id
            }
            onPress={() => void message.toggleReaction(reaction.emoji)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${emojiName}, ${reaction.count}`}
            accessibilityState={{ selected: reaction.me }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              borderRadius: 8,
              ...chipStyle,
              backgroundColor: reaction.me
                ? "rgba(88, 101, 242, 0.2)"
                : "rgba(255, 255, 255, 0.08)",
            }}
          >
            <MessageReactionEmoji emoji={reaction.emoji} />
            <Typography level="body-xs">{reaction.count}</Typography>
          </Pressable>
        );
      })}
    </Box>
  );
});
