import { AdaptiveAppIcon } from "@components/AdaptiveAppIcon";
import { useAppStore } from "@hooks/useStores";
import {
  ThemeProvider,
  type ThemeProviderRef,
  UiLabelsProvider,
} from "@mutualzz/ui-native";
import { Theme } from "@stores/objects/Theme";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";

export const AppTheme = observer(({ children }: PropsWithChildren) => {
  const app = useAppStore();
  const themeProviderRef = useRef<ThemeProviderRef>(null);
  const prefersDark = useColorScheme() === "dark";
  const { t } = useTranslation("common");

  const uiLabels = useMemo(
    () => ({
      closeModal: t("a11y.closeModal"),
      increment: t("a11y.increment"),
      decrement: t("a11y.decrement"),
      showPassword: t("a11y.showPassword"),
      openColorPicker: t("a11y.openColorPicker"),
      randomColor: t("a11y.randomColor"),
      randomColorHint: t("a11y.randomColorHint"),
      removeColorStop: t("a11y.removeColorStop"),
    }),
    [t],
  );

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
      <UiLabelsProvider labels={uiLabels}>
        <AdaptiveAppIcon />
        {children}
      </UiLabelsProvider>
    </ThemeProvider>
  );
});
