import { PROFILE_CANVAS_REF_WIDTH } from "@mutualzz/ui-core";
import { useCallback, useState, type PropsWithChildren } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const MIN_USER_SCALE = 1;
const MAX_USER_SCALE = 4;
const DOUBLE_TAP_ZOOM = 2.5;

interface Props extends PropsWithChildren {
  contentHeightUnits: number;
}

/**
 * Fits the fixed 1600-unit-wide profile canvas to the device width, then
 * layers pinch-to-zoom and two-finger pan on top so small blocks stay
 * readable. Pan requires two pointers so a one-finger drag always falls
 * through to the page's own ScrollView instead of fighting it.
 */
export function ProfileCanvasViewport({ contentHeightUnits, children }: Props) {
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setMeasuredWidth((prev) => (Math.abs(prev - width) > 0.5 ? width : prev));
  }, []);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const fitScale =
    measuredWidth > 0 ? measuredWidth / PROFILE_CANVAS_REF_WIDTH : 0;
  const visualHeight = contentHeightUnits * fitScale;

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(
        MAX_USER_SCALE,
        Math.max(MIN_USER_SCALE, savedScale.value * e.scale),
      );
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      const maxX = Math.max(0, (measuredWidth * (scale.value - 1)) / 2);
      const maxY = Math.max(0, (visualHeight * (scale.value - 1)) / 2);
      translateX.value = Math.min(maxX, Math.max(-maxX, translateX.value));
      translateY.value = Math.min(maxY, Math.max(-maxY, translateY.value));
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pan = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      const maxX = Math.max(0, (measuredWidth * (scale.value - 1)) / 2);
      const maxY = Math.max(0, (visualHeight * (scale.value - 1)) / 2);
      const nextX = savedTranslateX.value + e.translationX;
      const nextY = savedTranslateY.value + e.translationY;
      translateX.value = Math.min(maxX, Math.max(-maxX, nextX));
      translateY.value = Math.min(maxY, Math.max(-maxY, nextY));
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = scale.value > 1.01 ? 1 : DOUBLE_TAP_ZOOM;
      scale.value = withTiming(next);
      savedScale.value = next;
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    });

  const composedGesture = Gesture.Race(
    doubleTap,
    Gesture.Simultaneous(pinch, pan),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (measuredWidth <= 0) {
    return <View onLayout={onLayout} style={{ width: "100%" }} />;
  }

  const offsetLeft = -(PROFILE_CANVAS_REF_WIDTH * (1 - fitScale)) / 2;
  const offsetTop = -(contentHeightUnits * (1 - fitScale)) / 2;

  return (
    <GestureDetector gesture={composedGesture}>
      <View
        onLayout={onLayout}
        style={{ width: "100%", height: visualHeight, overflow: "hidden" }}
      >
        <Animated.View
          style={[
            { width: measuredWidth, height: visualHeight },
            animatedStyle,
          ]}
        >
          <View
            style={{
              position: "absolute",
              left: offsetLeft,
              top: offsetTop,
              width: PROFILE_CANVAS_REF_WIDTH,
              height: contentHeightUnits,
              transform: [{ scale: fitScale }],
            }}
          >
            {children}
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
