import type { SheetProps } from "@mutualzz/ui-native";
import { useWindowDimensions, type ViewStyle } from "react-native";

export const SHEET_WRAPPER_STYLE: ViewStyle = {
  width: "100%",
};

export const BOTTOM_SHEET_PROPS: Partial<SheetProps> = {
  showCloseButton: false,
  enableDynamicSizing: true,
};

export const FULL_SHEET_PROPS: Partial<SheetProps> = {
  showCloseButton: false,
  snapPoints: ["92%"],
  enableDynamicSizing: false,
};

export const PROFILE_SHEET_PROPS: Partial<SheetProps> = {
  ...FULL_SHEET_PROPS,
  showHandle: false,
};

export function useSheetMaxHeight(ratio = 0.9) {
  const { height, fontScale } = useWindowDimensions();
  const adjustedRatio = Math.min(
    0.95,
    ratio + Math.max(0, fontScale - 1) * 0.04,
  );
  return Math.round(height * adjustedRatio);
}

export const PROFILE_SHEET_HEIGHT_RATIO = 0.9;
