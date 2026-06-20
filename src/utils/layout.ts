import type { EdgeInsets } from "react-native-safe-area-context";
import { useSegments } from "expo-router";

export const FLOATING_USER_BAR_HEIGHT = 72;
export const TAB_BAR_VERTICAL_GAP = 12;

export const getFloatingTabBarInset = (insets: EdgeInsets) =>
    FLOATING_USER_BAR_HEIGHT +
    Math.max(insets.bottom, 12) +
    TAB_BAR_VERTICAL_GAP;

export function useIsTabBarHidden() {
    const segments: string[] = useSegments();

    const spacesIndex = segments.indexOf("spaces");
    const meIndex = segments.indexOf("@me");

    const inSpaceChannel =
        spacesIndex !== -1 && segments.length > spacesIndex + 2;

    const inDMChannel = meIndex !== -1 && segments.length > meIndex + 1;

    return inSpaceChannel || inDMChannel;
}

export function useHideSpacesSidebar() {
    const segments: string[] = useSegments();

    const spacesIndex = segments.indexOf("spaces");

    return spacesIndex !== -1 && segments.length > spacesIndex + 2;
}
