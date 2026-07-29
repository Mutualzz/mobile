import { createContext, useContext } from "react";
import type { SharedValue } from "react-native-reanimated";

export const CHAT_COMPOSER_NATIVE_ID = "mutualzz-chat-composer";

export interface ChatKeyboardContextValue {
  extraContentPadding: SharedValue<number>;
  composerHeight: SharedValue<number>;
}

const ChatKeyboardContext = createContext<ChatKeyboardContextValue | null>(
  null,
);

export function useChatKeyboard() {
  return useContext(ChatKeyboardContext);
}

export { ChatKeyboardContext };
