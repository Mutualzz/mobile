import { UnicodeEmoji } from "@components/emojis/UnicodeEmoji";
import { useAppStore } from "@hooks/useStores";
import type { PresenceActivityEmoji } from "@mutualzz/types";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Image } from "react-native";

interface Props {
  emoji: PresenceActivityEmoji;
  size?: number;
}

export const CustomStatusEmoji = observer(({ emoji, size = 22 }: Props) => {
  const app = useAppStore();

  useEffect(() => {
    if (emoji.id && !app.expressions.get(emoji.id)) {
      void app.expressions.resolve(emoji.id);
    }
  }, [app.expressions, emoji.id]);

  if (emoji.id) {
    const expression = app.expressions.get(emoji.id);
    if (!expression?.url) return null;

    return (
      <Image
        source={{ uri: expression.url }}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }

  if (!emoji.name?.trim()) return null;

  return <UnicodeEmoji value={emoji.name} size={size} />;
});
