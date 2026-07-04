import { useAppStore } from "@hooks/useStores";
import type { EdgeInsets } from "react-native-safe-area-context";
import { useSegments } from "expo-router";

export const FLOATING_USER_BAR_HEIGHT = 72;
export const TAB_BAR_VERTICAL_GAP = 12;

export const getFloatingTabBarInset = (insets: EdgeInsets) =>
  FLOATING_USER_BAR_HEIGHT + Math.max(insets.bottom, 12) + TAB_BAR_VERTICAL_GAP;

export function useIsTabBarHidden() {
  const app = useAppStore();
  const segments: string[] = useSegments();

  const inSpaceSettings =
    segments.includes("spaces") && segments.includes("settings");

  const inSpaceChannel = segments.includes("spaces") && !app.spacesDrawerOpen;

  const inDMChannel = segments.includes("@me") && !app.dmDrawerOpen;

  return inSpaceChannel || inDMChannel || inSpaceSettings;
}
