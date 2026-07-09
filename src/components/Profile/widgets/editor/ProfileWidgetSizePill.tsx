import type { ProfileBlockSize, ProfileBlockType } from "@mutualzz/types";
import { Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { Pressable } from "react-native";
import { getSupportedWidgetSizes } from "@components/Profile/widgets/profileWidget.constants";

const LABEL: Record<ProfileBlockSize, string> = { s: "S", m: "M", l: "L" };

interface Props {
  type: ProfileBlockType;
  size: ProfileBlockSize;
  onChange: (size: ProfileBlockSize) => void;
}

export function ProfileWidgetSizePill({ type, size, onChange }: Props) {
  const { theme } = useTheme();
  const pillSize = useScaledSquareSize(28);
  const supported = getSupportedWidgetSizes(type);

  const cycle = () => {
    const index = supported.indexOf(size);
    const next = supported[(index + 1) % supported.length];
    onChange(next);
  };

  if (supported.length <= 1) return null;

  return (
    <Pressable
      onPress={cycle}
      style={{
        minWidth: pillSize,
        height: pillSize,
        paddingHorizontal: 8,
        borderRadius: pillSize / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primary,
      }}
    >
      <Typography level="body-xs" weight="bold" style={{ color: "#fff" }}>
        {LABEL[size]}
      </Typography>
    </Pressable>
  );
}
