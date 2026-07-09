import { useKeyboardState } from "react-native-keyboard-controller";

export const useKeyboardOffset = () =>
  useKeyboardState((state) => state.height);

export const useKeyboardVisible = () =>
  useKeyboardState((state) => state.isVisible);
