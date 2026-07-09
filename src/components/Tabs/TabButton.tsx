import { resolveSize, type Size } from "@mutualzz/ui-core";
import {
  type ButtonProps,
  DecoratorWrapper,
  MAX_FONT_SCALE_MULTIPLIER,
  resolveButtonContainerStyles,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import { useScaledMinTouchSize } from "@utils/accessibilityLayout";
import { observer } from "mobx-react-lite";
import { forwardRef, type ReactNode } from "react";
import { Pressable, View } from "react-native";

interface Props extends Pick<
  ButtonProps,
  "size" | "color" | "children" | "style"
> {
  icon: ReactNode;
}

const baseSizeMap: Record<Size, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

const TabButtonComponent = forwardRef<View, Props>(
  (
    { children, icon, size = "sm", color = "neutral", style, ...props },
    ref,
  ) => {
    const { theme } = useTheme();
    const touchTarget = useScaledMinTouchSize();
    const resolvedSize = resolveSize(theme, size, baseSizeMap);

    return (
      <Pressable
        ref={ref}
        style={({ pressed }) => {
          const resolvedStyle =
            typeof style === "function"
              ? style({ pressed, hovered: false })
              : style;

          const containerVariant = resolveButtonContainerStyles(theme, color, {
            disabled: false,
            selected: false,
            pressed: false,
          })["plain"];

          return [
            containerVariant,
            resolvedStyle,
            {
              position: "relative",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              flexShrink: 0,
              flexGrow: 1,
              alignSelf: "stretch",
              width: "100%",
              padding: 0,
              ...touchTarget,
              transform: [{ translateY: pressed ? -2 : 0 }],
            },
          ];
        }}
        {...props}
      >
        <DecoratorWrapper>{icon}</DecoratorWrapper>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 0,
            flexShrink: 1,
            minWidth: 0,
            paddingHorizontal: 4,
          }}
        >
          <Typography
            truncate="single"
            maxFontSizeMultiplier={MAX_FONT_SCALE_MULTIPLIER}
            style={{
              fontSize: resolvedSize,
              textAlign: "center",
              color: theme.typography.colors.primary,
            }}
          >
            {children}
          </Typography>
        </View>
      </Pressable>
    );
  },
);

export default observer(TabButtonComponent);
