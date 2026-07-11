import { useKeyboardOpen } from "@hooks/useKeyboardOffset";
import { useTabBarContentInset } from "@hooks/useTabBarContentInset";
import { useIsTabBarHidden } from "@utils/layout";
import { useMemo } from "react";

/**
 * Bottom inset for scrollable main content: tab bar + safe area when the chrome
 * is visible, otherwise zero (keyboard/composer layouts handle their own insets).
 *
 * Uses useKeyboardOpen (height-aware) so inset stays 0 until the keyboard has
 * fully finished closing — matching tab chrome hide/show.
 */
export function useKeyboardChromeInset() {
  const tabBarInset = useTabBarContentInset();
  const keyboardOpen = useKeyboardOpen();
  const hideTabBar = useIsTabBarHidden();

  return useMemo(() => {
    if (keyboardOpen || hideTabBar) return 0;
    return tabBarInset;
  }, [hideTabBar, keyboardOpen, tabBarInset]);
}
