import { useEffect, useRef } from "react";
import { useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const useKeyboardOffset = () =>
  useKeyboardState((state) => state.height);

export const useKeyboardVisible = () =>
  useKeyboardState((state) => state.isVisible);

/**
 * True while the keyboard is open OR still animating closed.
 * Using height (not only isVisible) prevents chrome/inset from snapping back
 * mid-dismiss — that flash is what made the bottom look cramped for a beat.
 */
export function useKeyboardOpen() {
  return useKeyboardState(
    (state) => state.isVisible || state.height > 0,
  );
}

/**
 * Bottom padding for composer footers.
 * - Closed: safe area + breathing room above the home indicator / tab chrome
 * - Open: small gap so the input isn't flush against the keyboard
 */
export function useComposerSafePadding(extra = 12) {
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();
  return keyboardOpen ? Math.max(10, extra - 2) : insets.bottom + extra;
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
