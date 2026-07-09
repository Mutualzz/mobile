import { TypingIndicator } from "@components/TypingIndicator";
import type { Snowflake } from "@mutualzz/types";
import { useTheme } from "@mutualzz/ui-native";
import type { PropsWithChildren } from "react";
import { View } from "react-native";

interface Props extends PropsWithChildren {
  channelId: Snowflake;
}

export function ComposerFooter({ channelId, children }: Props) {
  const { theme } = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.surface }}>
      <TypingIndicator channelId={channelId} />
      {children}
    </View>
  );
}
