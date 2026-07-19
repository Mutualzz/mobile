import {
  dynamicElevation,
  extractGradientInfo,
  resolveWallpaperDimOverlay,
  resolveWallpaperScrim,
  resolveWallpaperSettings,
} from "@mutualzz/ui-core";
import {
  Canvas,
  Rect,
  LinearGradient as SkiaLinearGradient,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import {
  ImageBackground,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { observer } from "mobx-react-lite";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeBaselineProps } from "./NativeBaseline.types";
import { useTheme, angleToSkia } from "@mutualzz/ui-native";
import { useAppStore } from "@hooks/useStores";

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
});

const NativeBaseline = observer(({ children }: NativeBaselineProps) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const backgroundImageUrl = theme.backgroundImageUrl;
  const settings = useMemo(
    () => resolveWallpaperSettings(theme),
    [theme.wallpaper, theme.type, theme.colors.background, theme.colors.surface],
  );

  const bg = useMemo(() => theme.colors.background, [theme.colors.background]);

  const gradient = useMemo(() => {
    try {
      return extractGradientInfo(bg);
    } catch {
      return null;
    }
  }, [bg]);

  const portraitStretch = useMemo(() => {
    if (height <= width) return 1;
    const ratio = height / width;
    return Math.min(1.5, 1 + (ratio - 1) * 0.35);
  }, [width, height]);

  const gradientStops = useMemo(() => {
    if (!gradient || portraitStretch <= 1) return gradient;

    const shift = (portraitStretch - 1) * 0.22;
    return {
      ...gradient,
      positions: gradient.positions.map((position) =>
        Math.min(1, position + shift * (1 - position)),
      ),
    };
  }, [gradient, portraitStretch]);

  if (backgroundImageUrl) {
    return (
      <GestureHandlerRootView style={styles.fill}>
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
              { backgroundColor: resolveWallpaperDimOverlay(theme) },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.overlay,
              { backgroundColor: resolveWallpaperScrim(theme) },
            ]}
          />
          <SafeAreaView edges={["top", "left", "right"]} style={styles.fill}>
            {children}
          </SafeAreaView>
        </ImageBackground>
      </GestureHandlerRootView>
    );
  }

  if (!gradient) {
    return (
      <GestureHandlerRootView style={styles.fill}>
        <SafeAreaView
          edges={["top", "left", "right"]}
          style={[
            styles.fill,
            {
              backgroundColor: app.settings?.preferEmbossed
                ? dynamicElevation(theme.colors.surface, 2)
                : theme.colors.background,
            },
          ]}
        >
          {children}
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  const activeGradient = gradientStops ?? gradient;
  const { start, end } = angleToSkia(activeGradient.angle, width, height);

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaView edges={["top", "left", "right"]} style={styles.fill}>
        {width > 0 && height > 0 && (
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Rect dither x={0} y={0} width={width} height={height}>
              <SkiaLinearGradient
                start={vec(start.x, start.y)}
                end={vec(end.x, end.y)}
                colors={activeGradient.colors}
                positions={activeGradient.positions}
              />
            </Rect>
          </Canvas>
        )}
        {children}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
});

NativeBaseline.displayName = "NativeBaseline";

export { NativeBaseline };
