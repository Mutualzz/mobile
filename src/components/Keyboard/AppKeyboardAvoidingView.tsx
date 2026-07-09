import type { ComponentProps } from "react";
import { Platform } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

type Props = ComponentProps<typeof KeyboardAvoidingView>;

export function AppKeyboardAvoidingView({
  behavior,
  automaticOffset = true,
  style,
  ...props
}: Props) {
  return (
    <KeyboardAvoidingView
      behavior={
        behavior ?? (Platform.OS === "android" ? "height" : "padding")
      }
      automaticOffset={automaticOffset}
      style={[{ flex: 1 }, style]}
      {...props}
    />
  );
}
