import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { IconProps } from "phosphor-react-native";
import type { ComponentType } from "react";
import { Pressable } from "react-native";

export interface SpaceSheetQuickAction {
  key: string;
  label: string;
  Icon: ComponentType<IconProps>;
  onPress: () => void;
}

interface Props {
  actions: SpaceSheetQuickAction[];
}

export function SpaceSheetQuickActions({ actions }: Props) {
  if (actions.length === 0) return null;

  return (
    <Box
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
      }}
    >
      {actions.map((action) => (
        <QuickActionButton key={action.key} action={action} />
      ))}
    </Box>
  );
}

function QuickActionButton({ action }: { action: SpaceSheetQuickAction }) {
  const { theme } = useTheme();
  const { Icon, label, onPress } = action;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ alignItems: "center", gap: 8, flex: 1, maxWidth: 80 }}
    >
      <Box
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: `${theme.typography.colors.primary}12`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={24} weight="fill" color={theme.typography.colors.primary} />
      </Box>
      <Typography
        level="body-xs"
        weight={600}
        style={{ textAlign: "center" }}
        truncate="single"
      >
        {label}
      </Typography>
    </Pressable>
  );
}
