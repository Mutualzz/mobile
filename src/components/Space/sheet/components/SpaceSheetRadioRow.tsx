import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { Pressable } from "react-native";

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function SpaceSheetRadioRow({ label, selected, onPress }: Props) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Typography level="body-md" weight={500} style={{ flex: 1 }}>
        {label}
      </Typography>
      <Box
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected
            ? theme.colors.primary
            : theme.typography.colors.muted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected ? (
          <Box
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: theme.colors.primary,
            }}
          />
        ) : null}
      </Box>
    </Pressable>
  );
}
