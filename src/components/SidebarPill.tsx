import {
  Box,
  scaledLayoutSize,
  useFontScale,
  useTheme,
} from "@mutualzz/ui-native";
import type { ReactNode } from "react";

export type PillType = "none" | "unread" | "hover" | "active";

export const SIDEBAR_RAIL_ITEM_SIZE = 44;

interface PillProps {
  type: PillType;
}

export const SidebarPill = ({ type }: PillProps) => {
  const { theme } = useTheme();
  const fontScale = useFontScale();

  const pillHeight =
    type === "none"
      ? 0
      : type === "unread"
        ? scaledLayoutSize(8, fontScale, 1.3)
        : type === "hover"
          ? scaledLayoutSize(20, fontScale, 1.3)
          : scaledLayoutSize(40, fontScale, 1.3);

  const pillColor =
    type === "unread" ? theme.colors.warning : theme.colors.neutral;

  return (
    <Box
      style={{
        position: "absolute",
        left: -12,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <Box
        style={{
          width: 4,
          height: pillHeight,
          borderTopRightRadius: 4,
          borderBottomRightRadius: 4,
          backgroundColor: pillColor,
        }}
      />
    </Box>
  );
};

interface SlotProps {
  type: PillType;
  children: ReactNode;
  style?: React.ComponentProps<typeof Box>["style"];
}

export const SidebarRailSlot = ({ type, children, style }: SlotProps) => (
  <Box
    style={[
      {
        position: "relative",
        width: SIDEBAR_RAIL_ITEM_SIZE,
        height: SIDEBAR_RAIL_ITEM_SIZE,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
      },
      style,
    ]}
  >
    <SidebarPill type={type} />
    {children}
  </Box>
);
