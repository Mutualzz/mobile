import { Button } from "@components/Button";
import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { IconButton } from "@components/IconButton";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import TabBar from "@components/Tabs/TabBar";
import { UserBar } from "@components/User/UserBar";
import { VoiceChannelChatSheet } from "@components/Views/VoiceChannelChatSheet";
import { VoiceChannelParticipant } from "@components/Views/VoiceChannelParticipant";
import { VoiceParticipantActionSheet } from "@components/Views/VoiceParticipantActionSheet";
import { useElapsedClock } from "@hooks/useElapsedClock";
import { useKeyboardChromeInset } from "@hooks/useKeyboardChromeInset";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { VoiceState } from "@stores/objects/VoiceState";
import { getChannelOccupiedAt } from "@utils/voiceElapsed";
import { ArrowLeftIcon, ChatCircleIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { FlatList, Pressable } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  channel: Channel;
}

export const VoiceChannelView = observer(({ channel }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { t } = useTranslation("chat");
  const tabBarInset = useKeyboardChromeInset();
  const [chatOpen, setChatOpen] = useState(false);
  const [moderationTarget, setModerationTarget] = useState<VoiceState | null>(
    null,
  );
  const [moderationOpen, setModerationOpen] = useState(false);

  const space = channel.space;

  const members = app.voiceStates.getAllByChannel(channel.id);
  const channelElapsed = useElapsedClock(getChannelOccupiedAt(members));
  const selfId = app.account?.id;
  const isJoined = app.voice.isJoinedToChannel(channel.id);
  const isConnecting = isJoined && app.voice.connectionStatus === "connecting";
  const isConnected = isJoined && app.voice.connectionStatus === "connected";
  const joinFailed =
    app.voice.connectionStatus === "failed" &&
    app.voice.currentVoiceTarget?.channelId === channel.id;

  const openModeration = (state: VoiceState) => {
    setModerationTarget(state);
    setModerationOpen(true);
  };

  const requestCloseModeration = () => {
    setModerationOpen(false);
  };

  const handleModerationClosed = () => {
    setModerationTarget(null);
  };

  return (
    <>
      <Screen style={{ flexDirection: "column", borderWidth: 0 }}>
        <ScreenHeader
          style={{
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderTopWidth: 0,
          }}
        >
          <Pressable hitSlop={8} onPress={() => app.setSpacesDrawerOpen(true)}>
            <ArrowLeftIcon color={theme.typography.colors.primary} />
          </Pressable>
          <ChannelIcon type={channel.type} />
          <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Typography level="body-lg" weight="bold" truncate="single">
              {channel.name}
            </Typography>
            {channelElapsed && (
              <Typography
                level="body-xs"
                textColor="muted"
                accessibilityLabel={t("voice.channelOccupied", {
                  time: channelElapsed,
                })}
              >
                {channelElapsed}
              </Typography>
            )}
          </Box>
          <IconButton
            padding={6}
            accessibilityLabel={t("voice.openChat")}
            onPress={() => setChatOpen(true)}
          >
            <ChatCircleIcon size={20} weight="fill" />
          </IconButton>
        </ScreenHeader>

        <Box
          style={{ flex: 1, padding: 16, gap: 12, paddingBottom: tabBarInset }}
        >
          {!isJoined ? (
            <Box style={{ gap: 12, alignItems: "center", paddingVertical: 8 }}>
              <Typography textColor="muted" style={{ textAlign: "center" }}>
                {members.length === 0
                  ? t("voice.noOneInVoice")
                  : t("voice.peopleInVoice", { count: members.length })}
              </Typography>
              {channelElapsed && members.length > 0 && (
                <Typography
                  level="body-xs"
                  textColor="muted"
                  style={{ textAlign: "center" }}
                  accessibilityLabel={t("voice.channelOccupied", {
                    time: channelElapsed,
                  })}
                >
                  {t("voice.channelOccupied", { time: channelElapsed })}
                </Typography>
              )}
              <Button
                onPress={() =>
                  app.voice.joinChannel(channel.id, channel.spaceId ?? null)
                }
                fullWidth
              >
                {t("voice.joinVoice")}
              </Button>
              {joinFailed && (
                <Typography
                  color="danger"
                  variant="plain"
                  style={{ textAlign: "center" }}
                >
                  {app.voice.connectionError ??
                    t("voice.connection.failedFallback")}
                </Typography>
              )}
            </Box>
          ) : (
            <Typography textColor="muted">
              {isConnecting
                ? t("voice.connection.connecting")
                : isConnected
                  ? t("voice.connection.connected")
                  : (app.voice.connectionError ??
                    t("voice.connection.failedFallback"))}
            </Typography>
          )}

          <FlatList
            data={members}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <VoiceChannelParticipant
                state={item}
                space={space}
                selfId={selfId}
                showAudioControls={isConnected}
                onModerate={() => openModeration(item)}
              />
            )}
            ListEmptyComponent={
              <Typography textColor="muted">
                {t("voice.noOneConnectedYet")}
              </Typography>
            }
          />
        </Box>
      </Screen>

      <TabBar>
        <UserBar />
      </TabBar>

      <VoiceChannelChatSheet
        channel={channel}
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {moderationTarget && space && (
        <VoiceParticipantActionSheet
          state={moderationTarget}
          space={space}
          visible={moderationOpen}
          onRequestClose={requestCloseModeration}
          onClose={handleModerationClosed}
        />
      )}
    </>
  );
});
