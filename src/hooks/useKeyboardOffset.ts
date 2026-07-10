import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const useKeyboardOffset = () =>
  useKeyboardState((state) => state.height);

export const useKeyboardVisible = () =>
  useKeyboardState((state) => state.isVisible);

/** True when the software keyboard is open (incl. Android height fallback). */
export function useKeyboardOpen() {
  return useKeyboardState(
    (state) =>
      state.isVisible || (Platform.OS === "android" && state.height > 0),
  );
}

/** Bottom padding for inputs in a KeyboardStickyView footer. */
export function useComposerSafePadding(extra = 12) {
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();
  return keyboardOpen ? 0 : insets.bottom + extra;
}

/** Run a callback once when the keyboard opens. */
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
