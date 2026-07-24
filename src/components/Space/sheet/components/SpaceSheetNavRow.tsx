import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { IconProps } from "phosphor-react-native";
import { CaretRightIcon } from "phosphor-react-native";
import type { ComponentType } from "react";
import { Pressable } from "react-native";

interface Props {
  label: string;
  Icon: ComponentType<IconProps>;
  onPress: () => void;
  color?: "danger" | "neutral";
}

export function SpaceSheetNavRow({
  label,
  Icon,
  onPress,
  color = "neutral",
}: Props) {
  const { theme } = useTheme();
  const iconColor = useSettingsIconColor(color === "danger" ? "danger" : "info");
  const textColor =
    color === "danger"
      ? theme.colors.danger
      : theme.typography.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Icon weight="fill" size={20} color={iconColor} />
      <Typography
        level="body-md"
        weight={500}
        style={{ flex: 1, color: textColor }}
        truncate="single"
      >
        {label}
      </Typography>
      <CaretRightIcon
        size={16}
        weight="bold"
        color={theme.typography.colors.muted}
      />
    </Pressable>
  );
}
