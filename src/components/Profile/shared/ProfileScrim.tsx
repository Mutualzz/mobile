import { formatColor } from "@mutualzz/ui-core";
import { Box, useTheme } from "@mutualzz/ui-native";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export const ProfileScrim = ({ children }: Props) => {
  const { theme } = useTheme();

  return (
    <Box
      style={{
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: formatColor(theme.colors.surface, {
          format: "hexa",
          alpha: 72,
        }),
      }}
    >
      {children}
    </Box>
  );
};
