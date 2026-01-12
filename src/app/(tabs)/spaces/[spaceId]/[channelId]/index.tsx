import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { MessageInput } from "@components/Message/MessageInput";
import { MessageList } from "@components/Message/MessageList";
import { Paper } from "@components/Paper";
import { FontAwesome } from "@expo/vector-icons";
import { useKeyboardOffset } from "@hooks/useKeyboardOffset";
import { useAppStore } from "@hooks/useStores";
import { Typography, useTheme } from "@mutualzz/ui-native";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SpaceChannelIndex = () => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme } = useTheme();
    const keyboardHeight = useKeyboardOffset();
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (Platform.OS !== "android") return;

        const height =
            keyboardHeight === 0 ? 0 : -keyboardHeight - insets.bottom;

        Animated.timing(translateY, {
            toValue: height,
            duration: 150,
            useNativeDriver: true,
        }).start();
    }, [keyboardHeight, translateY]);

    const channel = app.channels.active;
    if (!channel) return null;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Paper
                style={{
                    flex: 1,

                    flexDirection: "column",
                }}
                elevation={app.preferEmbossed ? 2 : 0}
            >
                <Paper
                    style={{
                        flexDirection: "row",
                        paddingTop: insets.top,
                        paddingHorizontal: insets.left + 16,
                        paddingBottom: 8,
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "none",
                        zIndex: 1,
                    }}
                    elevation={app.preferEmbossed ? 3 : 0}
                >
                    <Pressable hitSlop={8} onPress={() => router.back()}>
                        <FontAwesome
                            style={{
                                marginRight: 8,
                            }}
                            name="arrow-left"
                            color={theme.colors.neutral}
                        />
                    </Pressable>
                    <ChannelIcon type={channel.type} />
                    <Typography>{channel.name}</Typography>
                </Paper>
                <Animated.View
                    style={{
                        flexDirection: "column",
                        flex: 1,
                        transform: [{ translateY }],
                    }}
                >
                    <MessageList channel={channel} />
                    <MessageInput channel={channel} />
                </Animated.View>
            </Paper>
        </KeyboardAvoidingView>
    );
};

export default observer(SpaceChannelIndex);
