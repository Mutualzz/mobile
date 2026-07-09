import { useAppStore } from "@hooks/useStores";
import type { PresenceActivityEmoji } from "@mutualzz/types";
import { getEmoji } from "@utils/emojis";
import { TWEMOJI_URL } from "@utils/urls";
import { observer } from "mobx-react-lite";
import { Image, Text } from "react-native";

interface Props {
  emoji: PresenceActivityEmoji;
  size?: number;
}

export const CustomStatusEmoji = observer(({ emoji, size = 18 }: Props) => {
  const app = useAppStore();

  if (emoji.id) {
    const expression = app.expressions.get(emoji.id);
    if (!expression?.url) return null;

    return (
      <Image
        source={{ uri: expression.url }}
        style={{ width: size, height: size, flexShrink: 0 }}
        resizeMode="contain"
      />
    );
  }

  const standard = getEmoji(emoji.name);
  if (standard?.hexcode) {
    return (
      <Image
        source={{
          uri: `${TWEMOJI_URL}/${standard.hexcode.toLowerCase()}.svg`,
        }}
        style={{ width: size, height: size, flexShrink: 0 }}
        resizeMode="contain"
      />
    );
  }

  return (
    <Text style={{ fontSize: size, lineHeight: size, flexShrink: 0 }}>
      {emoji.name}
    </Text>
  );
});
