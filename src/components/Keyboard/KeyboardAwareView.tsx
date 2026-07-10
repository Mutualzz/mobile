import { useKeyboardPaddingStyle } from "@hooks/useKeyboardPaddingStyle";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Lifts children when the keyboard opens by applying bottom padding equal to
 * keyboard height. Works reliably inside modals and transformed parents where
 * KeyboardAvoidingView layout math breaks.
 */
export function KeyboardAwareView({ style, children }: Props) {
  const keyboardStyle = useKeyboardPaddingStyle();

  return (
    <Animated.View style={[{ flex: 1, minHeight: 0 }, style, keyboardStyle]}>
      {children}
    </Animated.View>
  );
}
