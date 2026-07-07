import { MessageInput } from "@components/Message/MessageInput";
import { MessageList } from "@components/Message/MessageList";
import { TypingIndicator } from "@components/TypingIndicator";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { ArrowLeftIcon, ChatCircleIcon } from "phosphor-react-native";
import { useKeyboardOffset } from "@hooks/useKeyboardOffset";
import { useScreenComposer } from "@hooks/useScreenComposer";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EmptyDMState = () => {
  const { theme } = useTheme();

  return (
    <Screen style={{ flexDirection: "column" }}>
      <Box
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 24,
        }}
      >
        <ChatCircleIcon size={40} color={theme.typography.colors.muted} />
        <Typography textColor="muted" style={{ textAlign: "center" }}>
          Select a conversation to start chatting
        </Typography>
      </Box>
    </Screen>
  );
};

export const DMContentPane = observer(() => {
  const app = useAppStore();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const keyboardHeight = useKeyboardOffset();
  const translateY = useRef(new Animated.Value(0)).current;
  const composerVisible = useScreenComposer();

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const height = keyboardHeight === 0 ? 0 : -keyboardHeight - insets.bottom;

    Animated.timing(translateY, {
      toValue: height,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [keyboardHeight, translateY, insets.bottom]);

  useEffect(() => {
    if (app.dmDrawerOpen) Keyboard.dismiss();
  }, [app.dmDrawerOpen]);

  const channel = app.channels.active;
  if (!channel) return <EmptyDMState />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen style={{ flexDirection: "column" }}>
        <ScreenHeader safeHorizontal={false} style={{ paddingHorizontal: 12 }}>
          <Pressable hitSlop={8} onPress={() => app.setDMDrawerOpen(true)}>
            <ArrowLeftIcon
              size={22}
              weight="bold"
              color={theme.typography.colors.primary}
            />
          </Pressable>
        </ScreenHeader>
        <Animated.View
          style={{
            flex: 1,
            minHeight: 0,
            flexDirection: "column",
            transform: [{ translateY }],
          }}
        >
          <MessageList channel={channel} />
          <TypingIndicator channelId={channel.id} />
          {composerVisible && <MessageInput channel={channel} />}
        </Animated.View>
      </Screen>
    </KeyboardAvoidingView>
  );
});
