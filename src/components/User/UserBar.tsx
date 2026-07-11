import { ChangeOnlineStatusModal } from "@components/User/ChangeOnlineStatusModal";
import { IconButton } from "@components/IconButton";
import { SpaceModeratedSheet } from "@components/Modals/SpaceModeratedSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { useOpenUserProfile } from "@hooks/useOpenUserProfile";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useModal } from "@hooks/useModal";
import { useOpenBottomSheet } from "@hooks/useOpenBottomSheet";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { VoiceConnectionStatus } from "@stores/Voice.store";
import { shouldShowVoiceUserBarPill } from "@utils/layout";
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
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";

function getVoiceTitle(
  status: VoiceConnectionStatus,
  t: (key: string, options?: { ns?: string }) => string,
) {
  switch (status) {
    case "connecting":
      return t("voice.connection.rtcConnecting", { ns: "chat" });
    case "connected":
      return t("voice.connection.voiceConnected", { ns: "chat" });
    case "failed":
      return t("voice.connection.failed", { ns: "chat" });
    case "idle":
    default:
      return t("voice.title", { ns: "chat" });
  }
}

function getVoiceTitleColor(
  status: VoiceConnectionStatus,
  colors: ReturnType<typeof useTheme>["theme"]["colors"],
) {
  switch (status) {
    case "connecting":
      return colors.warning;
    case "connected":
      return colors.success;
    case "failed":
      return colors.danger;
    case "idle":
    default:
      return colors.neutral;
  }
}

export const UserBar = observer(() => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { navigate } = useAppNavigation();
  const { openModal } = useModal();
  const { openBottomSheet, closeBottomSheet } = useOpenBottomSheet();
  const account = app.account;
  const openProfile = useOpenUserProfile();
  const { t } = useTranslation("chat");

  const openStatusSheet = () => {
    openBottomSheet(
      "change-online-status",
      <ChangeOnlineStatusModal
        embedded
        onClose={() => closeBottomSheet("change-online-status")}
      />,
    );
  };

  const openSpaceModerated = (type: "muted" | "deafened") => {
    const modalId = type === "muted" ? "space-muted" : "space-deafened";
    openModal(modalId, <SpaceModeratedSheet type={type} modalId={modalId} />);
  };

  if (!account) return null;

  const customStatus = app.customStatus.effectiveText;
  const voiceChannel = app.voice.channel;
  const voiceStatus = app.voice.connectionStatus;
  const voiceError = app.voice.connectionError;

  const showVoicePill = shouldShowVoiceUserBarPill(app.voice);

  const voiceTitle = getVoiceTitle(voiceStatus, t);
  const voiceTitleColor = getVoiceTitleColor(voiceStatus, theme.colors);

  let voiceSubtitle: string | undefined;
  if (voiceChannel) {
    voiceSubtitle =
      `${voiceChannel.name ?? t("voice.title")} / ${voiceChannel.space?.name ?? ""}`.trim();
  } else if (voiceStatus === "failed") {
    voiceSubtitle = voiceError ?? t("voice.connection.unableToConnect");
  }

  const canHangup =
    Boolean(app.voice.currentSpaceId) && Boolean(app.voice.currentChannelId);
  const cameraEnabled = app.voice.cameraEnabled;
  const isPushToTalk = app.voice.isPushToTalkMode;
  const pushToTalkActive = app.voice.pushToTalkActive;
  const canUsePushToTalk =
    isPushToTalk && voiceStatus === "connected" && !app.voice.effectiveSelfMute;

  return (
    <>
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
              </Box>

              <IconButton
                variant="plain"
                padding={4}
                disabled={!canHangup}
                onPress={() => app.voice.leave()}
                accessibilityLabel={t("voice.connection.disconnectA11y")}
              >
                <PhoneXIcon weight="fill" color={theme.colors.danger} />
              </IconButton>
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
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Pressable
            onPress={() => openProfile(account, undefined, true)}
            onLongPress={openStatusSheet}
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
              <Typography level="body-sm" truncate="single">
                {account.displayName}
              </Typography>
              <Typography level="body-xs" textColor="muted" truncate="single">
                {customStatus || `@${account.username}`}
              </Typography>
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
    </>
  );
});
