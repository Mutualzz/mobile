import { useEmojiPreview } from "@hooks/useEmojiPreview";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import { findCustomEmoji } from "@utils/emojis/customEmoji";
import { Image as ExpoImage } from "expo-image";
import { observer } from "mobx-react-lite";
import { Image as RNImage, Pressable } from "react-native";

interface Props {
  raw: string;
  isEmojiOnly?: boolean;
  inline?: boolean;
}

export const CustomEmoji = observer(
  ({ raw, isEmojiOnly = false, inline = false }: Props) => {
    const app = useAppStore();
    const { openCustomEmojiPreview } = useEmojiPreview();
    const size = isEmojiOnly ? 36 : 22;

    if (!raw) return null;

    const expression = findCustomEmoji(app, raw);

    if (!expression?.url) {
      return inline ? raw : <Typography level="body-sm">{raw}</Typography>;
    }

    const handlePress = () => openCustomEmojiPreview(expression);

    if (inline) {
      return (
        <RNImage
          source={{ uri: expression.url }}
          style={{
            width: size,
            height: size,
            transform: [{ translateY: 2 }],
          }}
          resizeMode="contain"
          onPress={handlePress}
          accessibilityLabel={expression.name}
        />
      );
    }

    return (
      <Pressable onPress={handlePress} hitSlop={6}>
        <ExpoImage
          source={{ uri: expression.url }}
          style={{ width: size, height: size }}
          contentFit="contain"
          cachePolicy="memory-disk"
          accessibilityLabel={expression.name}
        />
      </Pressable>
    );
  },
);
