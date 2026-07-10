import { useAppStore } from "@hooks/useStores";
import type { VoiceConnectionStatus } from "@stores/Voice.store";
import type { EdgeInsets } from "react-native-safe-area-context";
import { useSegments } from "expo-router";

export const FLOATING_USER_BAR_HEIGHT = 72;
export const FLOATING_USER_BAR_VOICE_PILL_HEIGHT = 98;
export const TAB_BAR_VERTICAL_GAP = 12;
export const MODE_SWITCHER_SIZE = 36;
export const MODE_SWITCHER_BOTTOM_OFFSET = 8;

/** How far the mode switcher FAB intrudes above the snap feed card bottom edge. */
export const MODE_SWITCHER_SNAP_CLEARANCE =
  MODE_SWITCHER_BOTTOM_OFFSET + MODE_SWITCHER_SIZE;

interface VoiceUserBarState {
  channel: unknown;
  connectionStatus: VoiceConnectionStatus;
}

export function shouldShowVoiceUserBarPill(voice: VoiceUserBarState) {
  return (
    Boolean(voice.channel) ||
    voice.connectionStatus === "connecting" ||
    voice.connectionStatus === "failed"
  );
}

export function getUserBarHeight(showVoicePill = false) {
  return (
    FLOATING_USER_BAR_HEIGHT +
    (showVoicePill ? FLOATING_USER_BAR_VOICE_PILL_HEIGHT : 0)
  );
}

export const getFloatingTabBarInset = (
  insets: EdgeInsets,
  showVoicePill = false,
) =>
  getUserBarHeight(showVoicePill) +
  Math.max(insets.bottom, 12) +
  TAB_BAR_VERTICAL_GAP;

export function useIsTabBarHidden() {
  const app = useAppStore();
  const segments: string[] = useSegments();

  const inSpaceSettings =
    segments.includes("spaces") && segments.includes("settings");

  const inSpaceChannel = segments.includes("spaces") && !app.spacesDrawerOpen;

  const inDMChannel = segments.includes("@me") && !app.dmDrawerOpen;

  return inSpaceChannel || inDMChannel || inSpaceSettings;
}
