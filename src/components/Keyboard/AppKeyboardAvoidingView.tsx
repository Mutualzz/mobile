import type { ComponentProps } from "react";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

type Props = ComponentProps<typeof KeyboardAvoidingView>;

export function AppKeyboardAvoidingView({
  behavior = "padding",
  automaticOffset = true,
  ...props
}: Props) {
  return (
    <KeyboardAvoidingView
      behavior={behavior}
      automaticOffset={automaticOffset}
      {...props}
    />
  );
}
