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

const EDGE_HIT_ZONE_WIDTH = 24;
const OPEN_VELOCITY_THRESHOLD = 500;
const CLOSE_VELOCITY_THRESHOLD = 500;

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
  const touchStartX = useSharedValue(0);
  const touchStartY = useSharedValue(0);

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
    .manualActivation(true)
    .onTouchesDown((e, state) => {
      const touch = e.allTouches[0];
      if (!touch || touch.x > EDGE_HIT_ZONE_WIDTH) {
        state.fail();
        return;
      }
      touchStartX.value = touch.x;
      touchStartY.value = touch.y;
    })
    .onTouchesMove((e, state) => {
      const touch = e.allTouches[0];
      if (!touch) {
        state.fail();
        return;
      }
      const dx = touch.x - touchStartX.value;
      const dy = touch.y - touchStartY.value;
      if (Math.abs(dy) > 16) {
        state.fail();
        return;
      }
      if (dx > 10) {
        state.activate();
      }
    })
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
    .activeOffsetX(-12)
    .failOffsetY([-16, 16])
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
        e.velocityX > -CLOSE_VELOCITY_THRESHOLD;
      translateX.value = withTiming(shouldOpen ? 0 : closedX);
      scheduleOnRN(commit, shouldOpen);
    });

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value + width }],
  }));

  const peekWidth = Math.max(0, windowWidth - width);

  return (
    <View style={{ flex: 1 }}>
      <GestureDetector gesture={dragClose}>
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
      </GestureDetector>

      <GestureDetector gesture={edgeOpen}>
        <Animated.View style={[{ flex: 1 }, contentStyle]}>
          {children}
          <Pressable
            pointerEvents={open && peekWidth > 0 ? "auto" : "none"}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: peekWidth,
            }}
            onPress={() => commit(false)}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
