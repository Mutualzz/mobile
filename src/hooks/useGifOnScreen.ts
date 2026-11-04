import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useWindowDimensions, type View } from "react-native";

const CHECK_THROTTLE_MS = 150;

export const GifViewportContext = createContext(false);

const listeners = new Set<() => void>();
let checkTimer: ReturnType<typeof setTimeout> | null = null;

export function notifyGifViewportChanged() {
  if (checkTimer) return;

  checkTimer = setTimeout(() => {
    checkTimer = null;
    listeners.forEach((check) => check());
  }, CHECK_THROTTLE_MS);
}

export function useGifOnScreen(resetKey: string) {
  const tracked = useContext(GifViewportContext);
  const { height: windowHeight } = useWindowDimensions();
  const ref = useRef<View>(null);
  const [onScreen, setOnScreen] = useState(false);

  const check = useCallback(() => {
    ref.current?.measureInWindow((_x, y, _width, height) => {
      setOnScreen(height > 0 && y + height > 0 && y < windowHeight);
    });
  }, [windowHeight]);

  useEffect(() => {
    if (!tracked) return;

    listeners.add(check);
    check();
    return () => {
      listeners.delete(check);
    };
  }, [tracked, check, resetKey]);

  return { ref, onLayout: check, onScreen: !tracked || onScreen };
}
