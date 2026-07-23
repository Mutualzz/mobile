import { useKeyboardOpen } from "@hooks/useKeyboardOffset";
import { useTabBarContentInset } from "@hooks/useTabBarContentInset";
import { useIsTabBarHidden } from "@utils/layout";
import { useMemo } from "react";

export function useKeyboardChromeInset() {
  const tabBarInset = useTabBarContentInset();
  const keyboardOpen = useKeyboardOpen();
  const hideTabBar = useIsTabBarHidden();

  return useMemo(() => {
    if (keyboardOpen || hideTabBar) return 0;
    return tabBarInset;
  }, [hideTabBar, keyboardOpen, tabBarInset]);
}
