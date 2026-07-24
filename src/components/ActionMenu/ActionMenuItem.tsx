import { formatColor } from "@mutualzz/ui-core";
import { Typography, useTheme } from "@mutualzz/ui-native";
import { type ReactNode } from "react";
import { Pressable, View } from "react-native";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

export function ActionMenuItem({
  label,
  onPress,
  disabled = false,
  icon,
}: Props) {
  const { theme } = useTheme();
  const pressedBackground = formatColor(theme.typography.colors.primary, {
    alpha: 0.08,
    format: "hexa",
  });

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 44,
        opacity: disabled ? 0.35 : 1,
        backgroundColor: pressed && !disabled ? pressedBackground : "transparent",
      })}
    >
      {icon ? <View style={{ width: 20, alignItems: "center" }}>{icon}</View> : null}
      <Typography level="body-md" weight={500} numberOfLines={1} style={{ flex: 1 }}>
        {label}
      </Typography>
    </Pressable>
  );
}
