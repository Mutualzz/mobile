import { Button } from "@components/Button";
import { ChannelIcon } from "@components/Channel/ChannelIcon";
import { IconButton } from "@components/IconButton";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import TabBar from "@components/Tabs/TabBar";
import { UserBar } from "@components/User/UserBar";
import { VoiceChannelChatSheet } from "@components/Views/VoiceChannelChatSheet";
import {
  VoiceChannelControls,
  VOICE_CHANNEL_CONTROLS_HEIGHT,
} from "@components/Views/VoiceChannelControls";
import { VoiceChannelParticipant } from "@components/Views/VoiceChannelParticipant";
import { VoiceParticipantActionSheet } from "@components/Views/VoiceParticipantActionSheet";
import { useElapsedClock } from "@hooks/useElapsedClock";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { VoiceState } from "@stores/objects/VoiceState";
import { FLOATING_USER_BAR_HEIGHT, TAB_BAR_VERTICAL_GAP } from "@utils/layout";
import { getChannelOccupiedAt } from "@utils/voiceElapsed";
import { ArrowLeftIcon, ChatCircleIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

interface Props {
  channel: Channel;
}

const TILE_GAP = 8;

export const VoiceChannelView = observer(({ channel }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { t } = useTranslation("chat");
  const insets = useSafeAreaInsets();
  const [chatOpen, setChatOpen] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [moderationTarget, setModerationTarget] = useState<VoiceState | null>(
    null,
  );
  const [moderationOpen, setModerationOpen] = useState(false);

  const space = channel.space;

  const members = app.voiceStates.getAllByChannel(channel.id);
  const channelElapsed = useElapsedClock(getChannelOccupiedAt(members));
  const selfId = app.account?.id;
  const isJoined = app.voice.isJoinedToChannel(channel.id);
  const isConnected = isJoined && app.voice.connectionStatus === "connected";
  const joinFailed =
    app.voice.connectionStatus === "failed" &&
    app.voice.currentVoiceTarget?.channelId === channel.id;

  const fillStage = members.length > 0 && members.length <= 2;
  const tileWidth =
    stageWidth > 0 ? Math.floor((stageWidth - TILE_GAP) / 2) : 140;

  const bottomChromeHeight = isJoined
    ? VOICE_CHANNEL_CONTROLS_HEIGHT
    : FLOATING_USER_BAR_HEIGHT;
  const bottomInset =
    bottomChromeHeight + Math.max(insets.bottom, 12) + TAB_BAR_VERTICAL_GAP;

  const openActions = (state: VoiceState) => {
    setModerationTarget(state);
    setModerationOpen(true);
  };

  const requestCloseModeration = () => {
    setModerationOpen(false);
  };

  const handleModerationClosed = () => {
    setModerationTarget(null);
  };

  const renderParticipant = (item: VoiceState) => (
    <VoiceChannelParticipant
      key={item.userId}
      state={item}
      selfId={selfId}
      fill={fillStage}
      tileWidth={tileWidth}
      onOpenActions={
        String(item.userId) !== String(selfId)
          ? () => openActions(item)
          : undefined
      }
    />
  );

  const participantStage = (
    <Box
      style={{
        flex: 1,
        minHeight: fillStage ? 260 : undefined,
      }}
    >
      {members.length === 0 ? (
        <Box
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 24,
          }}
        >
          <Typography textColor="muted">
            {t("voice.noOneConnectedYet")}
          </Typography>
        </Box>
      ) : fillStage ? (
        <Box
          style={{
            flex: 1,
            flexDirection: "row",
            gap: TILE_GAP,
            alignItems: "stretch",
          }}
        >
          {members.map(renderParticipant)}
        </Box>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            alignContent: "flex-start",
            gap: TILE_GAP,
            paddingBottom: 8,
          }}
        >
          {members.map(renderParticipant)}
        </ScrollView>
      )}
    </Box>
  );

  return (
    <>
      <Screen
        surfaceRole={theme.backgroundImageUrl ? "content" : undefined}
        elevation={theme.backgroundImageUrl ? 0 : undefined}
        style={{ flexDirection: "column", borderWidth: 0 }}
      >
        <ScreenHeader
          elevation={theme.backgroundImageUrl ? 0 : undefined}
          style={{
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderTopWidth: 0,
            ...(theme.backgroundImageUrl
              ? { backgroundColor: "transparent" }
              : null),
          }}
        >
          <Pressable hitSlop={8} onPress={() => app.setSpacesDrawerOpen(true)}>
            <ArrowLeftIcon color={theme.typography.colors.primary} />
          </Pressable>
          <ChannelIcon type={channel.type} />
          <Box
            style={{
              flex: 1,
              minWidth: 0,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box
              style={{ flex: 1, minWidth: 0, flexDirection: "column", gap: 2 }}
            >
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
            {!isJoined && (
              <Box style={{ minWidth: 0, flexDirection: "column", gap: 2 }}>
                <Button
                  onPress={() =>
                    app.voice.joinChannel(channel.id, channel.spaceId ?? null)
                  }
                >
                  {t("voice.joinVoice")}
                </Button>
              </Box>
            )}
          </Box>
          {isJoined && (
            <IconButton
              padding={6}
              accessibilityLabel={t("voice.openChat")}
              onPress={() => setChatOpen(true)}
            >
              <ChatCircleIcon size={20} weight="fill" />
            </IconButton>
          )}
        </ScreenHeader>

        <Box
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: bottomInset,
            gap: 12,
          }}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            if (width > 0 && width !== stageWidth) {
              setStageWidth(width);
            }
          }}
        >
          {!isJoined ? (
            <Box style={{ gap: 16, flex: 1 }}>
              {members.length > 0 && participantStage}

              <Box style={{ gap: 8 }}>
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
            </Box>
          ) : (
            <Box style={{ flex: 1, gap: 10 }}>{participantStage}</Box>
          )}
        </Box>
      </Screen>

      {isJoined ? (
        <VoiceChannelControls />
      ) : (
        <TabBar>
          <UserBar />
        </TabBar>
      )}

      <VoiceChannelChatSheet
        channel={channel}
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {moderationTarget && (
        <VoiceParticipantActionSheet
          state={moderationTarget}
          space={space}
          visible={moderationOpen}
          showAudioControls={isConnected}
          onRequestClose={requestCloseModeration}
          onClose={handleModerationClosed}
        />
      )}
    </>
  );
});
