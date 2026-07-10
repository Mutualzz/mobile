import { ProfileBlockImage } from "@components/Profile/shared/ProfileBlockImage";
import type { UserProfile } from "@stores/objects/UserProfile";
import {
  extractGradientInfo,
  normalizeGradientStopPositions,
  resolveProfileBackgroundFill,
  type ColorLike,
} from "@mutualzz/ui-core";
import { angleToSkia, useTheme } from "@mutualzz/ui-native";
import {
  Canvas,
  Rect,
  LinearGradient as SkiaLinearGradient,
  vec,
} from "@shopify/react-native-skia";
import { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface Props {
  profile: UserProfile;
  backgroundColor?: string | null;
  backgroundImage?: string | null;
  style?: StyleProp<ViewStyle>;
}

export function ProfileBackgroundLayer({
  profile,
  backgroundColor,
  backgroundImage,
  style,
}: Props) {
  const { theme } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });

  const resolvedBackgroundColor =
    backgroundColor !== undefined
      ? backgroundColor
      : profile.backgroundColor;
  const backgroundImageSource =
    backgroundImage !== undefined ? backgroundImage : profile.backgroundImage;
  const backgroundImageUrl = profile.constructBackgroundUrlFrom(
    backgroundImageSource,
  );

  const fill = useMemo(
    () =>
      resolveProfileBackgroundFill(
        resolvedBackgroundColor,
        theme.colors.surface,
      ),
    [resolvedBackgroundColor, theme.colors.surface],
  );

  const gradient = useMemo(() => {
    try {
      return extractGradientInfo(fill as ColorLike);
    } catch {
      return null;
    }
  }, [fill]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    }
  };

  const gradientPositions = useMemo(() => {
    if (!gradient) return null;
    return normalizeGradientStopPositions(
      gradient.colors.length,
      gradient.positions,
    ).map((position) => position / 100);
  }, [gradient]);

  const gradientPoints = useMemo(() => {
    if (!gradient || size.width <= 0 || size.height <= 0) return null;
    return angleToSkia(gradient.angle, size.width, size.height);
  }, [gradient, size.height, size.width]);

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, style]}
    >
      {gradient && gradientPoints ? (
        size.width > 0 &&
        size.height > 0 && (
          <Canvas style={StyleSheet.absoluteFill}>
            <Rect dither x={0} y={0} width={size.width} height={size.height}>
              <SkiaLinearGradient
                start={vec(gradientPoints.start.x, gradientPoints.start.y)}
                end={vec(gradientPoints.end.x, gradientPoints.end.y)}
                colors={gradient.colors as string[]}
                positions={gradientPositions ?? undefined}
              />
            </Rect>
          </Canvas>
        )
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
      )}

      {backgroundImageUrl ? (
        <ProfileBlockImage
          uri={backgroundImageUrl}
          assetHash={backgroundImageSource}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
}
