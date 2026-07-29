import { Button as MzButton, useTheme, type ButtonProps } from "@mutualzz/ui-native";
import { forwardRef } from "react";
import { type View } from "react-native";

export const Button = forwardRef<View, ButtonProps>(
  ({ color, ...props }, ref) => {
    const { theme } = useTheme();

    return (
      <MzButton
        ref={ref}
        color={color ?? theme.typography.colors.primary}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
