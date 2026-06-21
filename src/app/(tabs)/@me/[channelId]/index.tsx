import { MessageInput } from "@components/Message/MessageInput";
import { MessageList } from "@components/Message/MessageList";
import { TypingIndicator } from "@components/TypingIndicator";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { ArrowLeftIcon } from "phosphor-react-native";
import { useKeyboardOffset } from "@hooks/useKeyboardOffset";
import { useScreenComposer } from "@hooks/useScreenComposer";
import { useAppStore } from "@hooks/useStores";
import { useTheme } from "@mutualzz/ui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DMChannelIndex = () => {
  const app = useAppStore();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const keyboardHeight = useKeyboardOffset();
  const translateY = useRef(new Animated.Value(0)).current;
  const composerVisible = useScreenComposer();

  useLayoutEffect(() => {
    if (!channelId) return;

    app.spaces.unsetActive();
    app.channels.setActive(channelId);
    app.channels.setMostRecentChannelForSpace("@me", channelId);
  }, [channelId, app.spaces, app.channels]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const height = keyboardHeight === 0 ? 0 : -keyboardHeight - insets.bottom;

    Animated.timing(translateY, {
      toValue: height,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [keyboardHeight, translateY, insets.bottom]);

  const channel = channelId ? app.channels.get(channelId) : null;
  if (!channel) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen style={{ flexDirection: "column" }}>
        <ScreenHeader safeHorizontal={false} style={{ paddingHorizontal: 12 }}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
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
          <MessageList key={channel.id} channel={channel} />
          <TypingIndicator channelId={channel.id} />
          {composerVisible && <MessageInput channel={channel} />}
        </Animated.View>
      </Screen>
    </KeyboardAvoidingView>
  );
};

export default observer(DMChannelIndex);
