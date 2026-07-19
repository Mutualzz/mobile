import { useTheme } from "@mutualzz/ui-native";
import {
  ThemeProvider as NavigationThemeProvider,
  type Theme,
} from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { observer } from "mobx-react-lite";
import { type PropsWithChildren, useMemo } from "react";

export const NavigationWithTheme = observer(
  ({ children }: PropsWithChildren) => {
    const { theme } = useTheme();
    const hasWallpaper = Boolean(theme.backgroundImageUrl);

    const navTheme: Theme = useMemo(
      () => ({
        dark: theme.type === "dark",
        colors: {
          primary: theme.colors.primary,
          background: hasWallpaper
            ? "transparent"
            : theme.colors.background,
          card: hasWallpaper ? "transparent" : theme.colors.surface,
          text: theme.typography.colors.primary,
          border: theme.colors.neutral,
          notification: theme.typography.colors.accent,
        },
        fonts: {
          regular: {
            fontFamily: theme.typography.fontFamily,
            fontWeight: "400",
          },
          medium: {
            fontFamily: theme.typography.fontFamily,
            fontWeight: "500",
          },
          bold: {
            fontFamily: theme.typography.fontFamily,
            fontWeight: "600",
          },
          heavy: {
            fontFamily: theme.typography.fontFamily,
            fontWeight: "700",
          },
        },
      }),
      [theme, hasWallpaper],
    );

    return (
      <NavigationThemeProvider value={navTheme}>
        <StatusBar style={theme.type === "dark" ? "light" : "dark"} animated />
        {children}
      </NavigationThemeProvider>
    );
  },
);
