import { useKeyboardVisible } from "@hooks/useKeyboardOffset";
import { useTabBarContentInset } from "@hooks/useTabBarContentInset";
import { useIsTabBarHidden } from "@utils/layout";
import { useMemo } from "react";

/**
 * Bottom inset for scrollable main content: tab bar + safe area when the chrome
 * is visible, otherwise zero (keyboard/composer layouts handle their own insets).
 */
export function useKeyboardChromeInset() {
  const tabBarInset = useTabBarContentInset();
  const keyboardVisible = useKeyboardVisible();
  const hideTabBar = useIsTabBarHidden();

  return useMemo(() => {
    if (keyboardVisible || hideTabBar) return 0;
    return tabBarInset;
  }, [hideTabBar, keyboardVisible, tabBarInset]);
}
