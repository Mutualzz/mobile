import {
  CHAT_COMPOSER_NATIVE_ID,
  ChatKeyboardContext,
} from "@contexts/ChatKeyboard.context";
import { useMemo, type ReactNode } from "react";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import {
  KeyboardGestureArea,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  children: ReactNode;
  footer: ReactNode;
}

export function KeyboardComposer({ children, footer }: Props) {
  const insets = useSafeAreaInsets();
  const composerHeight = useSharedValue(0);
  const extraContentPadding = useSharedValue(0);

  const value = useMemo(
    () => ({ extraContentPadding, composerHeight }),
    [extraContentPadding, composerHeight],
  );

  return (
    <ChatKeyboardContext.Provider value={value}>
      <KeyboardGestureArea
        style={{ flex: 1, minHeight: 0 }}
        interpolator="ios"
        textInputNativeID={CHAT_COMPOSER_NATIVE_ID}
      >
        <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
        <KeyboardStickyView
          offset={{ closed: 0, opened: insets.bottom }}
        >
          {footer}
        </KeyboardStickyView>
      </KeyboardGestureArea>
    </ChatKeyboardContext.Provider>
  );
}
