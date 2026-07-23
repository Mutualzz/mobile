import { CustomStatusDisplay } from "@components/CustomStatus/CustomStatusDisplay";
import { HubModeSwitcher } from "@components/Navigation/HubModeSwitcher";
import { IconButton } from "@components/IconButton";
import { SpaceModeratedSheet } from "@components/Sheets/SpaceModeratedSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { useElapsedClock } from "@hooks/useElapsedClock";
import { useOpenUserProfile } from "@hooks/useOpenUserProfile";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { shouldShowVoiceUserBarPill } from "@utils/layout";
import { hasCustomStatusContent } from "@mutualzz/client";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";
import { HeadphonesOffIcon } from "@components/icons/HeadphonesOffIcon";
import {
  HeadphonesIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneXIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  WaveformIcon,
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useNoiseSuppressionSheet } from "@components/User/NoiseSuppressionSheet";

export const UserBar = observer(() => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { navigate } = useAppNavigation();
  const { openSheet } = useSheet();
  const account = app.account;
  const openProfile = useOpenUserProfile();
  const { t } = useTranslation("chat");
  const openNoiseSuppression = useNoiseSuppressionSheet();

  const selfVoiceState = account ? app.voiceStates.get(account.id) : undefined;
  const selfElapsed = useElapsedClock(
    selfVoiceState?.channelId && !selfVoiceState.disconnectedAt
      ? selfVoiceState.joinedAt
      : null,
  );

  const openUserSheet = () => {
    if (!account) return;
    openProfile(account, undefined, true);
  };

  const openSpaceModerated = (type: "muted" | "deafened") => {
    const sheetId = type === "muted" ? "space-muted" : "space-deafened";
    openSheet(sheetId, <SpaceModeratedSheet type={type} sheetId={sheetId} />);
  };

  if (!account) return null;

  const customStatusText = app.customStatus.effectiveText;
  const customStatusEmoji = app.customStatus.effectiveEmoji;
  const hasCustomStatus = hasCustomStatusContent(
    customStatusText,
    customStatusEmoji,
  );
  const voiceChannel = app.voice.channel;
  const voiceStatus = app.voice.connectionStatus;
  const voiceError = app.voice.connectionError;
  const showVoicePill = shouldShowVoiceUserBarPill(app.voice);

  let voiceTitle: string;
  let voiceTitleColor: string;
  switch (voiceStatus) {
    case "connecting":
      voiceTitle = t("voice.connection.rtcConnecting");
      voiceTitleColor = theme.colors.warning;
      break;
    case "connected":
      voiceTitle = t("voice.connection.voiceConnected");
      voiceTitleColor = theme.colors.success;
      break;
    case "failed":
      voiceTitle = t("voice.connection.failed");
      voiceTitleColor = theme.colors.danger;
      break;
    case "idle":
    default:
      voiceTitle = t("voice.title");
      voiceTitleColor = theme.colors.neutral;
  }

  let voiceSubtitle: string | undefined;
  if (voiceChannel) {
    if (voiceChannel.spaceId) {
      voiceSubtitle =
        `${voiceChannel.name ?? t("voice.title")} / ${voiceChannel.space?.name ?? ""}`.trim();
    } else {
      voiceSubtitle =
        voiceChannel.name ||
        voiceChannel.dmRecipient?.displayName ||
        t("call.inCall");
    }
  } else if (voiceStatus === "failed") {
    voiceSubtitle = voiceError ?? t("voice.connection.unableToConnect");
  }

  const canHangup =
    Boolean(app.voice.currentChannelId) || voiceStatus === "failed";
  const cameraEnabled = app.voice.cameraEnabled;
  const isPushToTalk = app.voice.isPushToTalkMode;
  const pushToTalkActive = app.voice.pushToTalkActive;
  const canUsePushToTalk =
    isPushToTalk && voiceStatus === "connected" && !app.voice.effectiveSelfMute;

  const goToVoiceChannel = () => {
    if (!voiceChannel) return;

    app.channels.setActive(voiceChannel.id);

    if (voiceChannel.spaceId) {
      app.spaces.setActive(voiceChannel.spaceId);
      app.channels.setMostRecentChannelForSpace(
        voiceChannel.spaceId,
        voiceChannel.id,
      );
      app.setSpacesDrawerOpen(false);
      navigate(`/spaces/channel/${voiceChannel.id}`);
      return;
    }

    app.channels.setMostRecentChannelForSpace("@me", voiceChannel.id);
    app.setDMDrawerOpen(false);
    navigate(`/@me/${voiceChannel.id}`);
  };

  return (
    <Box>
      {showVoicePill && (
        <Box
          style={{
            gap: 10,
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: `${theme.typography.colors.muted}22`,
          }}
        >
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Pressable
              onPress={goToVoiceChannel}
              disabled={!voiceChannel}
              accessibilityRole="button"
              accessibilityLabel={
                voiceSubtitle ? `${voiceTitle}, ${voiceSubtitle}` : voiceTitle
              }
              style={{ flex: 1, minWidth: 0 }}
            >
              <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Typography
                  level="body-sm"
                  weight={700}
                  truncate="single"
                  style={{ color: voiceTitleColor }}
                >
                  {voiceTitle}
                </Typography>
                {voiceSubtitle && (
                  <Typography
                    level="body-xs"
                    textColor="secondary"
                    truncate="single"
                    style={{ fontFamily: "monospace" }}
                  >
                    {voiceSubtitle}
                  </Typography>
                )}
                {selfElapsed && (
                  <Typography
                    level="body-xs"
                    textColor="muted"
                    accessibilityLabel={t("voice.elapsedInChannel", {
                      time: selfElapsed,
                    })}
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {selfElapsed}
                  </Typography>
                )}
              </Box>
            </Pressable>

            <Box
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              {voiceStatus === "connected" && (
                <IconButton
                  variant="plain"
                  padding={4}
                  onPress={openNoiseSuppression}
                  accessibilityLabel={t(
                    "voice.controls.noiseSuppressionA11y",
                  )}
                  accessibilityState={{
                    selected: app.voice.noiseSuppression,
                  }}
                >
                  <WaveformIcon
                    weight="fill"
                    color={
                      app.voice.noiseSuppression
                        ? theme.colors.success
                        : theme.typography.colors.muted
                    }
                  />
                </IconButton>
              )}
              <IconButton
                variant="plain"
                padding={4}
                disabled={!canHangup}
                onPress={() => {
                  void app.voice.hangupCurrentDmCall();
                }}
                accessibilityLabel={t("voice.connection.disconnectA11y")}
              >
                <PhoneXIcon weight="fill" color={theme.colors.danger} />
              </IconButton>
            </Box>
          </Box>

          <Box style={{ flexDirection: "row", gap: 6 }}>
            {canUsePushToTalk && (
              <Pressable
                disabled={!canHangup}
                onPressIn={() => app.voice.setPushToTalkPressed(true)}
                onPressOut={() => app.voice.setPushToTalkPressed(false)}
                onTouchCancel={() => app.voice.setPushToTalkPressed(false)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: pushToTalkActive
                    ? theme.colors.success
                    : `${theme.colors.primary}22`,
                }}
                accessibilityRole="button"
                accessibilityLabel={t("voice.controls.holdToTalkA11y")}
                accessibilityState={{ selected: pushToTalkActive }}
              >
                <MicrophoneIcon
                  size={18}
                  weight="fill"
                  color={
                    pushToTalkActive
                      ? "#fff"
                      : theme.typography.colors.primary
                  }
                />
                <Typography
                  level="body-sm"
                  weight={600}
                  style={{
                    color: pushToTalkActive
                      ? "#fff"
                      : theme.typography.colors.primary,
                  }}
                >
                  {pushToTalkActive
                    ? t("voice.controls.talking")
                    : t("voice.controls.holdToTalk")}
                </Typography>
              </Pressable>
            )}
            <IconButton
              variant="soft"
              padding={8}
              onPress={() => {
                app.voice.toggleCamera();
                if (
                  voiceChannel &&
                  app.channels.activeId !== voiceChannel.id &&
                  !cameraEnabled
                ) {
                  app.channels.setActive(voiceChannel.id);
                  navigate(`/spaces/channel/${voiceChannel.id}`);
                }
              }}
              expand
              accessibilityLabel={
                cameraEnabled
                  ? t("voice.controls.disableCamera")
                  : t("voice.controls.enableCamera")
              }
            >
              {cameraEnabled ? (
                <VideoCameraIcon
                  size={18}
                  weight="fill"
                  color={theme.colors.success}
                />
              ) : (
                <VideoCameraSlashIcon size={18} weight="fill" />
              )}
            </IconButton>
          </Box>
        </Box>
      )}

      <Box
        style={{
          alignItems: "center",
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <HubModeSwitcher />
      </Box>

      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          minWidth: 0,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Pressable
          onPress={openUserSheet}
          accessibilityRole="button"
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
          }}
        >
          <UserAvatar
            user={account}
            size="lg"
            badge
            showInvisible
            speaking={
              app.voice.isUserSpeaking(account.id) &&
              !app.voice.effectiveSelfMute &&
              (!isPushToTalk || pushToTalkActive)
            }
          />
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Typography
              level="body-sm"
              truncate="single"
              style={{ flexShrink: 1 }}
            >
              {account.displayName}
            </Typography>
            {hasCustomStatus ? (
              <CustomStatusDisplay
                text={customStatusText}
                emoji={customStatusEmoji}
                level="body-xs"
                textColor="muted"
                emojiSize={14}
              />
            ) : (
              <Typography level="body-xs" textColor="muted" truncate="single">
                @{account.username}
              </Typography>
            )}
          </Box>
        </Pressable>

        <Box style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <IconButton
            variant="plain"
            padding={4}
            onPress={() => {
              if (app.voice.spaceMute) {
                openSpaceModerated("muted");
                return;
              }

              app.voice.setMute(!app.voice.selfMute);
            }}
            accessibilityLabel={
              app.voice.spaceMute
                ? t("voice.controls.spaceMuted")
                : app.voice.effectiveSelfMute
                  ? t("voice.controls.unmute")
                  : t("voice.controls.mute")
            }
          >
            {app.voice.effectiveSelfMute ? (
              <MicrophoneSlashIcon
                size={18}
                weight="fill"
                color={app.voice.spaceMute ? theme.colors.danger : undefined}
              />
            ) : (
              <MicrophoneIcon size={18} weight="fill" />
            )}
          </IconButton>

          <IconButton
            variant="plain"
            padding={4}
            onPress={() => {
              if (app.voice.spaceDeaf) {
                openSpaceModerated("deafened");
                return;
              }

              app.voice.setDeaf(!app.voice.selfDeaf);
            }}
            accessibilityLabel={
              app.voice.spaceDeaf
                ? t("voice.controls.spaceDeafened")
                : app.voice.effectiveSelfDeaf
                  ? t("voice.controls.undeafen")
                  : t("voice.controls.deafen")
            }
          >
            {app.voice.effectiveSelfDeaf ? (
              <HeadphonesOffIcon
                size={18}
                weight="fill"
                color={
                  app.voice.spaceDeaf
                    ? theme.colors.danger
                    : theme.typography.colors.muted
                }
              />
            ) : (
              <HeadphonesIcon size={18} weight="fill" />
            )}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
});
