import type { PropsWithChildren } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  contentContainerStyle?: KeyboardAwareScrollViewProps["contentContainerStyle"];
}>;

/**
 * Full-screen form layout (auth, settings). One keyboard layer: scroll inputs
 * into view without stacking KeyboardAvoidingView on top.
 */
export function KeyboardForm({
  children,
  style,
  scrollable = true,
  contentContainerStyle,
}: Props) {
  if (!scrollable) {
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }

  return (
    <KeyboardAwareScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
