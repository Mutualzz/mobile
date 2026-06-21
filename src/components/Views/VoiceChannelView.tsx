import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { UserAvatar } from "@components/User/UserAvatar";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { ArrowLeftIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { FlatList, Pressable } from "react-native";

interface Props {
  channel: Channel;
}

export const VoiceChannelView = observer(({ channel }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { back } = useAppNavigation();

  useEffect(() => {
    void app.voice.joinChannel(channel.id);
    return () => {
      void app.voice.leaveChannel();
    };
  }, [app.voice, channel.id]);

  const members = app.voiceStates.getAllByChannel(channel.id);

  return (
    <Screen style={{ flexDirection: "column" }}>
      <ScreenHeader>
        <Pressable hitSlop={8} onPress={back}>
          <ArrowLeftIcon color={theme.typography.colors.primary} />
        </Pressable>
        <ChannelIcon type={channel.type} />
        <Typography level="body-lg" weight="bold" style={{ flex: 1 }}>
          {channel.name}
        </Typography>
      </ScreenHeader>
      <Box style={{ flex: 1, padding: 16, gap: 12 }}>
        <Typography textColor="muted">
          Voice channel — WebRTC transport integration is in progress. Voice
          state sync is active.
        </Typography>
        <FlatList
          data={members}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 8,
              }}
            >
              <UserAvatar user={item.user ?? undefined} size={40} />
              <Typography>{item.user?.displayName ?? item.userId}</Typography>
            </Box>
          )}
          ListEmptyComponent={
            <Typography textColor="muted">No one is connected yet.</Typography>
          }
        />
      </Box>
    </Screen>
  );
});
