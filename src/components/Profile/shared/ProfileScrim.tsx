import { formatColor } from "@mutualzz/ui-core";
import { Box, useTheme } from "@mutualzz/ui-native";
import { useMemo, type ReactNode } from "react";
import type { ViewStyle } from "react-native";

interface Props {
  children: ReactNode;
}

export function useProfileScrimStyle(): ViewStyle {
  const { theme } = useTheme();

  return useMemo(
    () => ({
      backgroundColor: formatColor(theme.colors.surface, {
        format: "hexa",
        alpha: 80,
      }),
      borderWidth: 1,
      borderColor: formatColor(theme.colors.neutral, {
        format: "hexa",
        alpha: 15,
      }),
    }),
    [theme.colors.surface, theme.colors.neutral],
  );
}

export const ProfileScrim = ({ children }: Props) => {
  const scrimStyle = useProfileScrimStyle();

  return (
    <Box
      style={{
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        ...scrimStyle,
      }}
    >
      {children}
    </Box>
  );
};
