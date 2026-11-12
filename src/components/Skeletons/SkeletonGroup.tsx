import { Fragment, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

const TEXT_WIDTHS = [
  "72%",
  "48%",
  "86%",
  "38%",
  "64%",
  "55%",
  "92%",
  "44%",
] as const;
const NAME_WIDTHS = [96, 128, 80, 112, 104, 72];

export const pickTextWidth = (index: number, offset = 0) =>
  TEXT_WIDTHS[(index + offset) % TEXT_WIDTHS.length];

export const pickNameWidth = (index: number, offset = 0) =>
  NAME_WIDTHS[(index + offset) % NAME_WIDTHS.length];

interface SkeletonGroupProps {
  label: string;
  count?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  render: (index: number) => ReactNode;
}

export const SkeletonGroup = ({
  label,
  count = 3,
  gap = 10,
  style,
  render,
}: SkeletonGroupProps) => (
  <View
    accessible
    accessibilityRole="progressbar"
    accessibilityLabel={label}
    accessibilityState={{ busy: true }}
    style={[{ gap, width: "100%" }, style]}
  >
    {Array.from({ length: count }, (_item, index) => (
      <Fragment key={index}>{render(index)}</Fragment>
    ))}
  </View>
);
