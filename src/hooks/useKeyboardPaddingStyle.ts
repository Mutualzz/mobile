import { useAnimatedStyle } from "react-native-reanimated";
import { useKeyboardContext } from "react-native-keyboard-controller";

/**
 * Bottom padding that tracks keyboard height. Reanimated keyboard height is
 * negative when open (for translateY), so we negate it for padding.
 *
 * Prefer this over useReanimatedKeyboardAnimation, which enables adjustResize
 * on Android and would double-lift with manual padding.
 */
export function useKeyboardPaddingStyle() {
  const { height } = useKeyboardContext().reanimated;

  return useAnimatedStyle(() => ({
    paddingBottom: Math.max(0, -height.value),
  }));
}
