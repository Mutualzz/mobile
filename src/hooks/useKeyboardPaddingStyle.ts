import { useKeyboardContext } from "react-native-keyboard-controller";
import { useAnimatedStyle } from "react-native-reanimated";

export function useKeyboardPaddingStyle() {
  const { height } = useKeyboardContext().reanimated;

  return useAnimatedStyle(() => {
    const keyboard = Math.max(0, -height.value);
    return {
      paddingBottom: keyboard,
    };
  });
}
