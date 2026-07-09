import { InlineTwemoji, Twemoji } from "@components/emojis/Twemoji";
import { useEmojiPreview } from "@hooks/useEmojiPreview";
import { Box } from "@mutualzz/ui-native";
import { Pressable } from "react-native";

interface EmojiProps {
  url: string;
  isEmojiOnly: boolean;
  name?: string;
  unicode?: string;
  inline?: boolean;
}

export const Emoji = ({
  isEmojiOnly,
  unicode,
  name,
  inline = false,
}: EmojiProps) => {
  const { openDefaultEmojiPreview } = useEmojiPreview();
  const size = isEmojiOnly ? 36 : 22;
  const value = unicode ?? "";

  if (!value) return null;

  const handlePress = () => {
    if (name) openDefaultEmojiPreview(name, value);
  };

  if (inline) {
    return (
      <InlineTwemoji
        value={value}
        size={size}
        onPress={name ? handlePress : undefined}
      />
    );
  }

  return (
    <Pressable onPress={name ? handlePress : undefined} hitSlop={6}>
      <Box
        style={{
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
          overflow: "visible",
        }}
      >
        <Twemoji value={value} size={size} />
      </Box>
    </Pressable>
  );
};
