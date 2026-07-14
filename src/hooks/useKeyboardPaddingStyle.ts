import { useKeyboardContext } from "react-native-keyboard-controller";
import {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

/**
 * Bottom padding that tracks keyboard height (+ optional extra for a sticky
 * footer that overlays the list). Reanimated keyboard height is negative when
 * open (for translateY), so we negate it for padding.
 *
 * Prefer this over useReanimatedKeyboardAnimation, which enables adjustResize
 * on Android and would double-lift with manual padding.
 */
export function useKeyboardPaddingStyle(extraPadding?: SharedValue<number>) {
  const { height } = useKeyboardContext().reanimated;

  return useAnimatedStyle(() => {
    const keyboard = Math.max(0, -height.value);
    const extra = extraPadding?.value ?? 0;
    const footerClearance = keyboard > 0 ? extra : 0;
    return {
      paddingBottom: footerClearance > 0 ? keyboard + footerClearance : 0,
    };
  });
}
