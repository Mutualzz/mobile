import { VoiceChannelView } from "@components/Views/VoiceChannelView";
import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { MemberListModal } from "@components/MemberList/MemberListModal";
import { MessageInput } from "@components/Message/MessageInput";
import { MessageList } from "@components/Message/MessageList";
import { TypingIndicator } from "@components/TypingIndicator";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { ArrowLeftIcon, HashIcon, UsersIcon } from "phosphor-react-native";
import { useScreenComposer } from "@hooks/useScreenComposer";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Keyboard, Pressable, View } from "react-native";

const EmptyChannelState = () => {
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
                <HashIcon size={40} color={theme.typography.colors.muted} />
                <Typography textColor="muted" style={{ textAlign: "center" }}>
                    Select a channel to start chatting
                </Typography>
            </Box>
        </Screen>
    );
};

export const ChannelContentPane = observer(() => {
    const app = useAppStore();
    const { theme } = useTheme();
    const composerVisible = useScreenComposer();
    const [memberListOpen, setMemberListOpen] = useState(false);

    useEffect(() => {
        if (app.spacesDrawerOpen) Keyboard.dismiss();
    }, [app.spacesDrawerOpen]);

    const channel = app.channels.active;
    if (!channel) return <EmptyChannelState />;

    if (channel.type === ChannelType.Voice) {
        return <VoiceChannelView channel={channel} />;
    }

    return (
        <AppKeyboardAvoidingView style={{ flex: 1 }}>
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
                    <Pressable
                        hitSlop={8}
                        onPress={() => app.setSpacesDrawerOpen(true)}
                    >
                        <ArrowLeftIcon color={theme.typography.colors.primary} />
                    </Pressable>
                    <ChannelIcon type={channel.type} />
                    <Typography style={{ flex: 1 }}>{channel.name}</Typography>
                    <Pressable hitSlop={8} onPress={() => setMemberListOpen(true)}>
                        <UsersIcon
                            color={theme.typography.colors.primary}
                            weight="fill"
                        />
                    </Pressable>
                </ScreenHeader>
                <View
                    style={{
                        flexDirection: "column",
                        flex: 1,
                        minHeight: 0,
                    }}
                >
                    <MessageList channel={channel} />
                    <TypingIndicator channelId={channel.id} />
                    {composerVisible && <MessageInput channel={channel} />}
                </View>
            </Screen>

            <MemberListModal
                channel={channel}
                visible={memberListOpen}
                onClose={() => setMemberListOpen(false)}
            />
        </AppKeyboardAvoidingView>
    );
});
