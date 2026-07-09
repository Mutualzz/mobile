import { TypingIndicator } from "@components/TypingIndicator";
import type { Snowflake } from "@mutualzz/types";
import { useTheme } from "@mutualzz/ui-native";
import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";

interface Props extends PropsWithChildren {
  channelId: Snowflake;
}

/** Pins the composer above the keyboard without resizing the message list. */
export function ComposerFooter({ channelId, children }: Props) {
  const { theme } = useTheme();

  return (
    <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
      <View style={{ backgroundColor: theme.colors.surface }}>
        <TypingIndicator channelId={channelId} />
        {children}
      </View>
    </KeyboardStickyView>
  );
}
