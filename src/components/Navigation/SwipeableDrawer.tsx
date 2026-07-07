import {
  useEffect,
  useRef,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const EDGE_HIT_ZONE_WIDTH = 20;
const OPEN_VELOCITY_THRESHOLD = 500;

interface Props extends PropsWithChildren {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drawerContent: ReactNode;
  drawerWidth?: number;
}

export function SwipeableDrawer({
  open,
  onOpenChange,
  drawerContent,
  children,
  drawerWidth,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const width = drawerWidth ?? windowWidth;

  const closedX = -width;
  const translateX = useSharedValue(open ? 0 : closedX);
  const startX = useSharedValue(open ? 0 : closedX);

  const lastCommittedOpenRef = useRef(open);

  useEffect(() => {
    if (lastCommittedOpenRef.current === open) return;
    lastCommittedOpenRef.current = open;
    translateX.value = withTiming(open ? 0 : closedX, { duration: 250 });
  }, [open, closedX, translateX]);

  const commit = (next: boolean) => {
    lastCommittedOpenRef.current = next;
    onOpenChange(next);
  };

  const edgeOpen = Gesture.Pan()
    .enabled(!open)
    .activeOffsetX(10)
    .failOffsetY([-15, 15])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      translateX.value = Math.min(
        0,
        Math.max(closedX, startX.value + e.translationX),
      );
    })
    .onEnd((e) => {
      const shouldOpen =
        translateX.value > closedX + width * 0.4 ||
        e.velocityX > OPEN_VELOCITY_THRESHOLD;
      translateX.value = withTiming(shouldOpen ? 0 : closedX);
      scheduleOnRN(commit, shouldOpen);
    });

  const dragClose = Gesture.Pan()
    .enabled(open)
    .activeOffsetX(-10)
    .failOffsetY([-15, 15])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      translateX.value = Math.min(
        0,
        Math.max(closedX, startX.value + e.translationX),
      );
    })
    .onEnd((e) => {
      const shouldOpen =
        translateX.value > closedX + width * 0.6 &&
        e.velocityX > -OPEN_VELOCITY_THRESHOLD;
      translateX.value = withTiming(shouldOpen ? 0 : closedX);
      scheduleOnRN(commit, shouldOpen);
    });

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value + width }],
  }));

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width,
          },
          drawerStyle,
        ]}
      >
        {drawerContent}
      </Animated.View>

      <GestureDetector gesture={dragClose}>
        <Animated.View style={[{ flex: 1 }, contentStyle]}>
          {children}
          <Pressable
            pointerEvents={open ? "auto" : "none"}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: Math.max(0, windowWidth - width),
            }}
            onPress={() => commit(false)}
          />
        </Animated.View>
      </GestureDetector>

      {!open && (
        <GestureDetector gesture={edgeOpen}>
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: EDGE_HIT_ZONE_WIDTH,
            }}
          />
        </GestureDetector>
      )}
    </View>
  );
}
