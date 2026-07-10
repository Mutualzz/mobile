import { useKeyboardPaddingStyle } from "@hooks/useKeyboardPaddingStyle";
import type { ReactNode } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { KeyboardStickyView } from "react-native-keyboard-controller";

interface Props {
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Chat-style layout: main content shrinks as the keyboard opens and the footer
 * sticks to the keyboard. Works inside drawers, modals, and other transformed
 * parents where KeyboardAvoidingView breaks.
 */
export function KeyboardComposer({ children, footer }: Props) {
  const listInsetStyle = useKeyboardPaddingStyle();

  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      <Animated.View style={[{ flex: 1, minHeight: 0 }, listInsetStyle]}>
        {children}
      </Animated.View>
      <KeyboardStickyView>{footer}</KeyboardStickyView>
    </View>
  );
}
