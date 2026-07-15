import { useEffect, useRef } from "react";
import { useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const useKeyboardOffset = () =>
  useKeyboardState((state) => state.height);

export const useKeyboardVisible = () =>
  useKeyboardState((state) => state.isVisible);

export function useKeyboardOpen() {
  return useKeyboardState(
    (state) => state.isVisible || state.height > 0,
  );
}

export function useComposerSafePadding(extra = 12) {
  const insets = useSafeAreaInsets();
  return insets.bottom + extra;
}

export function useOnKeyboardOpen(callback: () => void) {
  const keyboardOpen = useKeyboardOpen();
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (keyboardOpen && !wasOpenRef.current) {
      requestAnimationFrame(callback);
    }
    wasOpenRef.current = keyboardOpen;
  }, [callback, keyboardOpen]);
}
