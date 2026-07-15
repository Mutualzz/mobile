import { useKeyboardPaddingStyle } from "@hooks/useKeyboardPaddingStyle";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function KeyboardAwareView({ style, children }: Props) {
  const keyboardStyle = useKeyboardPaddingStyle();

  return (
    <Animated.View style={[{ flex: 1, minHeight: 0 }, style, keyboardStyle]}>
      {children}
    </Animated.View>
  );
}
