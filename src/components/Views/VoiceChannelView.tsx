import { Button } from "@components/Button";
import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { IconButton } from "@components/IconButton";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { VoiceChannelChatSheet } from "@components/Views/VoiceChannelChatSheet";
import { VoiceChannelParticipant } from "@components/Views/VoiceChannelParticipant";
import { VoiceParticipantActionSheet } from "@components/Views/VoiceParticipantActionSheet";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { VoiceState } from "@stores/objects/VoiceState";
import {
  ArrowLeftIcon,
  ChatCircleIcon,
  HeadphonesIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneXIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { FlatList, Pressable } from "react-native";

interface Props {
  channel: Channel;
}

export const VoiceChannelView = observer(({ channel }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const [moderationTarget, setModerationTarget] = useState<VoiceState | null>(
    null,
  );

  const space = channel.space;

  const members = app.voiceStates.getAllByChannel(channel.id);
  const selfId = app.account?.id;
  const isJoined = app.voice.isJoinedToChannel(channel.id);
  const isConnecting = isJoined && app.voice.connectionStatus === "connecting";
  const isConnected = isJoined && app.voice.connectionStatus === "connected";
  const joinFailed =
    app.voice.connectionStatus === "failed" &&
    app.voice.currentVoiceTarget?.channelId === channel.id;

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
          <Typography level="body-lg" weight="bold" style={{ flex: 1 }}>
            {channel.name}
          </Typography>
          <IconButton
            padding={6}
            color="neutral"
            accessibilityLabel="Open chat"
            onPress={() => setChatOpen(true)}
          >
            <ChatCircleIcon size={20} weight="fill" />
          </IconButton>
        </ScreenHeader>

        <Box style={{ flex: 1, padding: 16, gap: 12 }}>
          {!isJoined ? (
            <Box style={{ gap: 12, alignItems: "center", paddingVertical: 8 }}>
              <Typography textColor="muted" style={{ textAlign: "center" }}>
                {members.length === 0
                  ? "No one is in voice right now."
                  : `${members.length} ${members.length === 1 ? "person is" : "people are"} in voice.`}
              </Typography>
              <Button
                onPress={() =>
                  app.voice.joinChannel(channel.id, channel.spaceId ?? null)
                }
                fullWidth
              >
                Join Voice
              </Button>
              {joinFailed ? (
                <Typography
                  color="danger"
                  variant="plain"
                  style={{ textAlign: "center" }}
                >
                  {app.voice.connectionError ?? "Voice connection failed"}
                </Typography>
              ) : null}
            </Box>
          ) : (
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Typography textColor="muted" style={{ flex: 1 }}>
                {isConnecting
                  ? "Connecting to voice..."
                  : isConnected
                    ? "Connected to voice"
                    : (app.voice.connectionError ?? "Voice connection failed")}
              </Typography>
              <Box style={{ flexDirection: "row", gap: 6 }}>
                <Pressable
                  disabled={!isConnected}
                  onPress={() => app.voice.setMute(!app.voice.selfMute)}
                >
                  {app.voice.effectiveSelfMute ? (
                    <MicrophoneSlashIcon
                      size={18}
                      color={theme.typography.colors.primary}
                      weight="fill"
                    />
                  ) : (
                    <MicrophoneIcon
                      size={18}
                      color={theme.typography.colors.primary}
                      weight="fill"
                    />
                  )}
                </Pressable>
                <Pressable
                  disabled={!isConnected}
                  onPress={() => app.voice.setDeaf(!app.voice.selfDeaf)}
                >
                  <HeadphonesIcon
                    size={18}
                    color={theme.typography.colors.primary}
                    weight="fill"
                  />
                </Pressable>
                <Pressable
                  disabled={!isConnected}
                  onPress={() => void app.voice.toggleCamera()}
                >
                  {app.voice.cameraEnabled ? (
                    <VideoCameraIcon
                      size={18}
                      color={theme.typography.colors.primary}
                      weight="fill"
                    />
                  ) : (
                    <VideoCameraSlashIcon
                      size={18}
                      color={theme.typography.colors.primary}
                      weight="fill"
                    />
                  )}
                </Pressable>
                <Pressable onPress={() => void app.voice.leave()}>
                  <PhoneXIcon
                    size={18}
                    color={theme.colors.danger}
                    weight="fill"
                  />
                </Pressable>
              </Box>
            </Box>
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
                onModerate={() => setModerationTarget(item)}
              />
            )}
            ListEmptyComponent={
              <Typography textColor="muted">
                No one is connected yet.
              </Typography>
            }
          />
        </Box>
      </Screen>

      <VoiceChannelChatSheet
        channel={channel}
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {space && moderationTarget ? (
        <VoiceParticipantActionSheet
          state={moderationTarget}
          space={space}
          visible
          onClose={() => setModerationTarget(null)}
        />
      ) : null}
    </>
  );
});
