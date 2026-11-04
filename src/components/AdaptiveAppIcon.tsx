import { useAppStore } from "@hooks/useStores";
import { Theme } from "@stores/objects/Theme";
import { DEFAULT_APP_ICON_COLOR, syncAppIcon } from "@utils/appIcon";
import { reaction } from "mobx";
import { useEffect } from "react";

// iOS alerts on every icon change, so wait until the user stops switching themes
const ICON_SETTLE_MS = 3000;

export const AdaptiveAppIcon = () => {
  const app = useAppStore();

  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const dispose = reaction(
      () => {
        if (!app.settings) return undefined;

        // Read from settings, not the active theme: space themes and system
        // light/dark switches shouldn't change the icon
        const themeId = app.settings.currentIcon || app.settings.currentTheme;
        if (!themeId) return DEFAULT_APP_ICON_COLOR;

        const theme = app.themes.themes.get(themeId);
        return theme && Theme.toEmotion(theme).colors.primary;
      },
      (primary) => {
        clearTimeout(settleTimer);
        if (!primary) return;

        settleTimer = setTimeout(() => void syncAppIcon(primary), ICON_SETTLE_MS);
      },
      { fireImmediately: true },
    );

    return () => {
      clearTimeout(settleTimer);
      dispose();
    };
  }, [app]);

  return null;
};
