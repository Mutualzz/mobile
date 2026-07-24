import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { useAppStore } from "@hooks/useStores";
import {
  resolveWallpaperDimOverlay,
  resolveWallpaperSettings,
  resolveWallpaperScrim,
} from "@mutualzz/ui-core";
import { Box, ThemeContext } from "@mutualzz/ui-native";
import { Theme } from "@stores/objects/Theme";
import { observer } from "mobx-react-lite";
import type { PropsWithChildren } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFill },
});

export const SpaceThemeProvider = observer(
  ({ children }: PropsWithChildren) => {
    const app = useAppStore();
    const space = app.spaces.active;
    const themeCreator = app.themeCreator;

    const previewingSpaceTheme =
      themeCreator.inPreview &&
      !!themeCreator.spaceId &&
      themeCreator.spaceId === space?.id;

    if (!space?.themeId && !previewingSpaceTheme) return children;

    const source =
      space?.theme ??
      (space?.themeId ? (app.themes.themes.get(space.themeId) ?? null) : null);

    if (!source && !previewingSpaceTheme) return children;

    const emotionTheme = previewingSpaceTheme
      ? themeCreator.buildPreviewEmotion()
      : Theme.toEmotion(source!);
    const backgroundImageUrl = emotionTheme.backgroundImageUrl;
    const settings = resolveWallpaperSettings(emotionTheme);

    const content = backgroundImageUrl ? (
      <ImageBackground
        source={{ uri: backgroundImageUrl }}
        style={styles.fill}
        resizeMode="cover"
        imageStyle={{
          opacity: Math.min(Math.max(settings.brightness / 100, 0.2), 1),
        }}
      >
        <View
          pointerEvents="none"
          style={[
            styles.overlay,
            { backgroundColor: resolveWallpaperDimOverlay(emotionTheme) },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.overlay,
            { backgroundColor: resolveWallpaperScrim(emotionTheme) },
          ]}
        />
        <Box flex={1}>{children}</Box>
      </ImageBackground>
    ) : (
      <Box flex={1} style={{ backgroundColor: "transparent" }}>
        {children}
      </Box>
    );

    return (
      <ThemeContext.Provider
        value={{
          theme: emotionTheme,
          changeTheme: () => undefined,
          type: emotionTheme.type,
        }}
      >
        <EmotionThemeProvider theme={emotionTheme}>
          {content}
        </EmotionThemeProvider>
      </ThemeContext.Provider>
    );
  },
);
