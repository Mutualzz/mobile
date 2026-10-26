import { AdaptiveAppIcon } from "@components/AdaptiveAppIcon";
import { useAppStore } from "@hooks/useStores";
import { ThemeProvider, type ThemeProviderRef } from "@mutualzz/ui-native";
import { Theme } from "@stores/objects/Theme";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

export const AppTheme = observer(({ children }: PropsWithChildren) => {
  const app = useAppStore();
  const themeProviderRef = useRef<ThemeProviderRef>(null);
  const prefersDark = useColorScheme() === "dark";

  useEffect(() => {
    const dispose = reaction(
      () => ({
        userTheme: app.settings?.currentTheme,
        userIcon: app.settings?.currentIcon,
        spaceThemeId: app.spaces.active?.themeId,
      }),
      ({ userTheme, userIcon, spaceThemeId }) => {
        const themes = app.themes.all;

        if (userIcon !== app.themes.currentIcon)
          app.themes.setCurrentIcon(userIcon ?? null);

        const pick = (id?: string | null) => {
          const pickenTheme = themes.find((t) => t.id === id);
          if (!pickenTheme) return undefined;
          return Theme.toEmotion(pickenTheme);
        };

        const selectedTheme = spaceThemeId
          ? pick(spaceThemeId) || pick(userTheme)
          : pick(userTheme);

        if (!selectedTheme) {
          if (themeProviderRef.current?.type !== null) {
            themeProviderRef.current?.changeTheme(null);
          }
          return;
        }

        if (selectedTheme.id === themeProviderRef.current?.theme?.id) return;

        themeProviderRef.current?.changeTheme(selectedTheme);
      },
      { fireImmediately: true },
    );

    return dispose;
  }, [prefersDark]);

  return (
    <ThemeProvider ref={themeProviderRef}>
      <AdaptiveAppIcon />
      {children}
    </ThemeProvider>
  );
});
