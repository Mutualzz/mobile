import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { MemberListModal } from "@components/MemberList/MemberListModal";
import { MessageInput } from "@components/Message/MessageInput";
import { MessageList } from "@components/Message/MessageList";
import { TypingIndicator } from "@components/TypingIndicator";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { ArrowLeftIcon, UsersIcon } from "phosphor-react-native";
import { useKeyboardOffset } from "@hooks/useKeyboardOffset";
import { useAppStore } from "@hooks/useStores";
import { Typography, useTheme } from "@mutualzz/ui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SpaceChannelIndex = () => {
  const app = useAppStore();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const keyboardHeight = useKeyboardOffset();
  const translateY = useRef(new Animated.Value(0)).current;
  const [memberListOpen, setMemberListOpen] = useState(false);

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
      keyboardVerticalOffset={0}
    >
      <Screen
        style={{
          flexDirection: "column",
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
        }}
      >
        <ScreenHeader
          style={{
            zIndex: 1,
            borderTopWidth: 0,
            borderLeftWidth: 0,
            borderRightWidth: 0,
          }}
        >
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <ArrowLeftIcon color={theme.typography.colors.primary} />
          </Pressable>
          <ChannelIcon type={channel.type} />
          <Typography style={{ flex: 1 }}>{channel.name}</Typography>
          <Pressable hitSlop={8} onPress={() => setMemberListOpen(true)}>
            <UsersIcon color={theme.typography.colors.primary} weight="fill" />
          </Pressable>
        </ScreenHeader>
        <Animated.View
          style={{
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            transform: [{ translateY }],
          }}
        >
          <MessageList key={channel.id} channel={channel} />
          <TypingIndicator channelId={channel.id} />
          <MessageInput channel={channel} />
        </Animated.View>
      </Screen>

      <MemberListModal
        channel={channel}
        visible={memberListOpen}
        onClose={() => setMemberListOpen(false)}
      />
    </KeyboardAvoidingView>
  );
};

export default observer(SpaceChannelIndex);
