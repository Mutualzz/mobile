import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { type ReactNode } from "react";
import { Pressable } from "react-native";

interface Props {
  label: string;
  onPress?: () => void;
  startDecorator?: ReactNode;
  endDecorator?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

export function SpaceSheetMenuRow({
  label,
  onPress,
  startDecorator,
  endDecorator,
  disabled = false,
  danger = false,
}: Props) {
  const { theme } = useTheme();
  const textColor = danger
    ? theme.colors.danger
    : disabled
      ? theme.typography.colors.muted
      : theme.typography.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 13,
        minHeight: 48,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {startDecorator ? (
        <Box style={{ width: 24, alignItems: "center" }}>{startDecorator}</Box>
      ) : null}
      <Typography
        level="body-md"
        weight={500}
        style={{ flex: 1, color: textColor }}
        truncate="single"
      >
        {label}
      </Typography>
      {endDecorator}
    </Pressable>
  );
}
