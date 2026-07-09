import { InlineTwemoji, Twemoji } from "@components/emojis/Twemoji";
import { Box } from "@mutualzz/ui-native";

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
  inline = false,
}: EmojiProps) => {
  const size = isEmojiOnly ? 36 : 22;
  const value = unicode ?? "";

  if (!value) return null;

  if (inline) {
    return <InlineTwemoji value={value} size={size} />;
  }

  return (
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
  );
};
