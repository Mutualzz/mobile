import { useChatKeyboard } from "@contexts/ChatKeyboard.context";
import { forwardRef, useRef } from "react";
import {
  Keyboard,
  type GestureResponderEvent,
  type ScrollViewProps,
} from "react-native";
import {
  KeyboardChatScrollView,
  type KeyboardChatScrollViewProps,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = ScrollViewProps &
  Partial<
    Pick<
      KeyboardChatScrollViewProps,
      "inverted" | "keyboardLiftBehavior" | "extraContentPadding" | "offset"
    >
  >;

const TAP_SLOP = 10;

export const ChatListScrollView = forwardRef<unknown, Props>(
  function ChatListScrollView(
    {
      inverted,
      keyboardLiftBehavior = "whenAtEnd",
      extraContentPadding: extraContentPaddingProp,
      offset: offsetProp,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
      ...props
    },
    ref,
  ) {
    const insets = useSafeAreaInsets();
    const chatKeyboard = useChatKeyboard();
    const extraContentPadding =
      extraContentPaddingProp ?? chatKeyboard?.extraContentPadding;
    const offset = offsetProp ?? insets.bottom;
    const tapStartY = useRef<number | null>(null);

    const handleTouchStart = (event: GestureResponderEvent) => {
      tapStartY.current = event.nativeEvent.pageY;
      onTouchStart?.(event);
    };

    const handleTouchMove = (event: GestureResponderEvent) => {
      if (tapStartY.current != null) {
        const dy = Math.abs(event.nativeEvent.pageY - tapStartY.current);
        if (dy > TAP_SLOP) {
          tapStartY.current = null;
        }
      }
      onTouchMove?.(event);
    };

    const handleTouchEnd = (event: GestureResponderEvent) => {
      if (tapStartY.current != null) {
        tapStartY.current = null;
        Keyboard.dismiss();
      }
      onTouchEnd?.(event);
    };

    const handleTouchCancel = (event: GestureResponderEvent) => {
      tapStartY.current = null;
      onTouchCancel?.(event);
    };

    return (
      <KeyboardChatScrollView
        ref={ref as never}
        inverted={inverted}
        keyboardLiftBehavior={keyboardLiftBehavior}
        extraContentPadding={extraContentPadding}
        offset={offset}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        {...props}
      />
    );
  },
);
