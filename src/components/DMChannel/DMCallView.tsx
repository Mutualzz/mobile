import { CallRingingAvatar } from "@components/Call/CallRingingAvatar";
import { IconButton } from "@components/IconButton";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { useElapsedClock } from "@hooks/useElapsedClock";
import { dynamicElevation, formatColor } from "@mutualzz/ui-core";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";
import {
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneIcon,
  PhoneSlashIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
} from "phosphor-react-native";
import { Pressable } from "react-native";
import { RTCView } from "react-native-webrtc";
import { useTranslation } from "react-i18next";

interface Props {
  channel: Channel;
}

const CallParticipantTile = observer(
  ({
    userId,
    displayName,
    fill,
  }: {
    userId: string;
    displayName: string;
    fill?: boolean;
  }) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const isSelf = app.account?.id === userId;
    const cameraStream = isSelf
      ? app.voice.getLocalCameraStream()
      : app.voice.getCameraStreamForUser(userId);
    const streamURL = cameraStream?.toURL?.() ?? null;
    const speaking =
      app.voice.isUserSpeaking(userId) &&
      !(isSelf && app.voice.effectiveSelfMute);
    const muted = isSelf
      ? app.voice.effectiveSelfMute
      : !!app.voiceStates.get(userId)?.selfMute;

    return (
      <Box
        style={{
          flex: fill ? 1 : undefined,
          width: fill ? undefined : 140,
          maxWidth: fill ? undefined : 180,
          maxHeight: fill ? undefined : 180,
          aspectRatio: 1,
          borderRadius: 8,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: dynamicElevation(theme.colors.surface, 3),
          borderWidth: speaking ? 3 : 0,
          borderColor: speaking ? theme.colors.success : "transparent",
        }}
      >
        {streamURL ? (
          <RTCView
            streamURL={streamURL}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
            objectFit="cover"
            mirror={isSelf}
            zOrder={0}
          />
        ) : (
          <UserAvatar user={app.users.get(userId) ?? null} size={fill ? 80 : 64} />
        )}
        {muted && (
          <Box
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 26,
              height: 26,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
              backgroundColor: formatColor(theme.colors.danger, {
                alpha: 0.92,
                format: "hexa",
              }),
            }}
          >
            <MicrophoneSlashIcon size={14} weight="fill" color="#fff" />
          </Box>
        )}
        <Box
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            bottom: 10,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 4,
            backgroundColor: formatColor(theme.colors.background, {
              alpha: 0.65,
              format: "hexa",
            }),
          }}
        >
          <Typography level="label-xs" textColor="primary" truncate="single">
            {displayName}
          </Typography>
        </Box>
      </Box>
    );
  },
);

const CallRingingParticipantTile = observer(
  ({
    userId,
    displayName,
    fill,
  }: {
    userId: string;
    displayName: string;
    fill?: boolean;
  }) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const { t } = useTranslation("chat");
    const user = app.users.get(userId) ?? null;

    return (
      <Box
        style={{
          flex: fill ? 1 : undefined,
          width: fill ? undefined : 140,
          maxWidth: fill ? undefined : 180,
          maxHeight: fill ? undefined : 180,
          aspectRatio: 1,
          borderRadius: 8,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: dynamicElevation(theme.colors.surface, 3),
        }}
      >
        <Box
          style={{
            flex: 1,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 40,
          }}
        >
          <CallRingingAvatar user={user} size={fill ? 80 : 64} pulsing dimmed />
        </Box>
        <Box
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            bottom: 10,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 4,
            zIndex: 2,
            backgroundColor: formatColor(theme.colors.background, {
              alpha: 0.65,
              format: "hexa",
            }),
          }}
        >
          <Typography level="label-xs" textColor="primary" truncate="single">
            {displayName}
          </Typography>
          <Typography level="label-xs" textColor="secondary">
            {t("call.calling")}
          </Typography>
        </Box>
      </Box>
    );
  },
);

export const DMCallView = observer(({ channel }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { t } = useTranslation("chat");

  const call = app.calls.getCall(channel.id);
  const ringingForMe = app.calls.isRingingForMe(channel.id);
  const outgoing = app.calls.isOutgoing(channel.id);
  const inThisCall =
    app.voice.currentChannelId === channel.id &&
    app.voice.connectionStatus !== "idle";

  const selfId = app.account?.id ? String(app.account.id) : null;
  const selfVoiceState = selfId ? app.voiceStates.get(selfId) : undefined;
  const elapsed = useElapsedClock(
    call &&
      call.status !== "ended" &&
      inThisCall &&
      selfVoiceState?.channelId &&
      String(selfVoiceState.channelId) === String(channel.id) &&
      !selfVoiceState.disconnectedAt
      ? selfVoiceState.joinedAt
      : null,
  );

  if (!call || call.status === "ended") return null;

  const isParticipant =
    !!selfId &&
    (String(call.initiatorId) === selfId ||
      call.accepted.includes(selfId) ||
      call.ringing.includes(selfId));
  const showHangup = inThisCall || outgoing;

  const voiceStates = Array.from(channel.voiceStates.values());
  const voiceUserIds = new Set(voiceStates.map((state) => String(state.userId)));
  const ringingTargets = call.ringing
    .map(String)
    .filter((id) => id !== selfId && !voiceUserIds.has(id));
  const pendingSelf =
    outgoing && !!selfId && !voiceUserIds.has(selfId) ? selfId : null;
  const participantCount =
    (pendingSelf ? 1 : 0) + voiceStates.length + ringingTargets.length;
  const connecting =
    inThisCall && app.voice.connectionStatus === "connecting";
  const fillPair =
    participantCount === 2 && !ringingForMe && !connecting;
  const showIncomingStage = ringingForMe;
  const showCallerGrid =
    !showIncomingStage &&
    (outgoing || voiceStates.length > 0 || ringingTargets.length > 0);
  const cameraEnabled = app.voice.cameraEnabled;
  const selfMute = app.voice.selfMute;

  const initiator = app.users.get(String(call.initiatorId));
  const ringingPeerId = call.ringing.find((id) => String(id) !== selfId);
  const stageUser = ringingForMe
    ? (initiator ??
      channel.dmRecipient ??
      (ringingPeerId ? app.users.get(String(ringingPeerId)) : null) ??
      null)
    : outgoing
      ? (channel.isDM
          ? (channel.dmRecipient ??
            (ringingPeerId ? app.users.get(String(ringingPeerId)) : null) ??
            null)
          : (channel.dmRecipients[0] ??
            (ringingPeerId ? app.users.get(String(ringingPeerId)) : null) ??
            null))
      : (initiator ?? null);
  const stageName =
    stageUser?.displayName ??
    (channel.isGroupDM ? (channel.name ?? t("deletedUser")) : t("deletedUser"));

  const stageBackground = dynamicElevation(theme.colors.surface, 2);
  const controlsBackground = dynamicElevation(theme.colors.surface, 4);
  const controlCircle = dynamicElevation(theme.colors.surface, 5);
  const divider = formatColor(theme.colors.neutral, {
    alpha: 0.22,
    format: "hexa",
  });

  const hangup = () => {
    void (async () => {
      const isInitiator =
        !!selfId && String(call.initiatorId) === selfId;
      if (isInitiator && (call.status === "ringing" || outgoing)) {
        await app.calls.cancel(channel.id);
      } else if (!isInitiator && isParticipant) {
        await app.calls.abandon(channel.id);
      } else if (!inThisCall && isParticipant) {
        await app.calls.abandon(channel.id);
      }
      await app.voice.leave();
    })();
  };

  return (
    <Box
      style={{
        borderBottomWidth: 1,
        borderBottomColor: divider,
        backgroundColor: stageBackground,
      }}
    >
      <Box
        style={{
          gap: 12,
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 16,
          minHeight:
            showIncomingStage || (!showCallerGrid && voiceStates.length === 0)
              ? 200
              : undefined,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showIncomingStage ? (
          <Box
            style={{
              width: "100%",
              minHeight: 160,
              height: 180,
              borderRadius: 8,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: dynamicElevation(theme.colors.surface, 3),
              position: "relative",
            }}
          >
            <Box
              style={{
                flex: 1,
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: 36,
              }}
            >
              <CallRingingAvatar
                user={stageUser}
                size={88}
                pulsing
                dimmed
              />
            </Box>
            <Box
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: formatColor(theme.colors.background, {
                  alpha: 0.55,
                  format: "hexa",
                }),
              }}
            >
              <Typography
                level="label-sm"
                textColor="primary"
                numberOfLines={1}
                style={{
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {stageName}
              </Typography>
            </Box>
          </Box>
        ) : showCallerGrid ? (
          <Box
            style={{
              flexDirection: "row",
              flexWrap: fillPair ? "nowrap" : "wrap",
              justifyContent: "center",
              gap: 8,
              width: "100%",
            }}
          >
            {pendingSelf && (
              <CallParticipantTile
                key={`self:${pendingSelf}`}
                userId={pendingSelf}
                displayName={
                  app.account?.displayName ??
                  app.users.get(pendingSelf)?.displayName ??
                  t("deletedUser")
                }
                fill={fillPair}
              />
            )}
            {voiceStates.map((state) => (
              <CallParticipantTile
                key={state.userId}
                userId={state.userId}
                displayName={state.user?.displayName ?? t("deletedUser")}
                fill={fillPair}
              />
            ))}
            {ringingTargets.map((userId) => (
              <CallRingingParticipantTile
                key={`ringing:${userId}`}
                userId={userId}
                displayName={
                  app.users.get(userId)?.displayName ?? t("deletedUser")
                }
                fill={fillPair}
              />
            ))}
          </Box>
        ) : (
          <Box
            style={{
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              paddingVertical: 4,
            }}
          >
            <CallRingingAvatar
              user={stageUser}
              size={120}
              pulsing={false}
              dimmed={false}
            />
            <Typography
              level="title-md"
              textColor="primary"
              style={{ fontWeight: "700", textAlign: "center" }}
            >
              {stageName}
            </Typography>
          </Box>
        )}
      </Box>

      <Box
        style={{
          paddingHorizontal: 20,
          paddingVertical: 18,
          borderTopWidth: 1,
          borderTopColor: divider,
          backgroundColor: controlsBackground,
          gap: 10,
          alignItems: "center",
        }}
      >
        {elapsed && !ringingForMe && (
          <Typography
            level="label-sm"
            textColor="secondary"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {elapsed}
          </Typography>
        )}
        {ringingForMe ? (
          <Box
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "flex-start",
              gap: 36,
            }}
          >
            <Box style={{ alignItems: "center", gap: 8 }}>
              <IconButton
                padding={16}
                variant="solid"
                color="danger"
                accessibilityLabel={t("call.decline")}
                onPress={() => void app.calls.decline(channel.id)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.danger,
                }}
              >
                <PhoneSlashIcon size={26} weight="fill" color="#fff" />
              </IconButton>
              <Typography level="label-xs" textColor="secondary">
                {t("call.decline")}
              </Typography>
            </Box>
            <Box style={{ alignItems: "center", gap: 8 }}>
              <IconButton
                padding={16}
                color="success"
                variant="solid"
                accessibilityLabel={t("call.accept")}
                onPress={() => void app.calls.accept(channel.id)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.success,
                }}
              >
                <PhoneIcon size={26} weight="fill" color="#fff" />
              </IconButton>
              <Typography level="label-xs" textColor="secondary">
                {t("call.accept")}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            {(inThisCall || outgoing) && (
              <>
                <IconButton
                  padding={12}
                  variant="soft"
                  onPress={() => app.voice.setMute(!app.voice.selfMute)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    backgroundColor: selfMute
                      ? theme.colors.danger
                      : controlCircle,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selfMute ? (
                    <MicrophoneSlashIcon size={22} weight="fill" color="#fff" />
                  ) : (
                    <MicrophoneIcon size={22} weight="fill" />
                  )}
                </IconButton>
                <IconButton
                  padding={12}
                  variant="soft"
                  onPress={() => void app.voice.toggleCamera()}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    backgroundColor: cameraEnabled
                      ? controlCircle
                      : theme.colors.danger,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {cameraEnabled ? (
                    <VideoCameraIcon size={22} weight="fill" />
                  ) : (
                    <VideoCameraSlashIcon
                      size={22}
                      weight="fill"
                      color="#fff"
                    />
                  )}
                </IconButton>
              </>
            )}

            {!inThisCall && !outgoing && !ringingForMe && (
              <Pressable
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 12,
                  borderRadius: 999,
                  backgroundColor: theme.colors.success,
                  flexDirection: "row",
                  gap: 8,
                }}
                onPress={() =>
                  void app.voice.join({
                    spaceId: null,
                    channelId: channel.id,
                  })
                }
              >
                <PhoneIcon size={18} weight="fill" color="#fff" />
                <Typography weight={700} style={{ color: "#fff" }}>
                  {t("call.join")}
                </Typography>
              </Pressable>
            )}

            {showHangup && (
              <IconButton
                padding={12}
                color="danger"
                variant="solid"
                onPress={hangup}
                style={{
                  width: 56,
                  height: 48,
                  borderRadius: 999,
                  backgroundColor: theme.colors.danger,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PhoneIcon
                  size={22}
                  weight="fill"
                  color="#fff"
                  style={{ transform: [{ rotate: "135deg" }] }}
                />
              </IconButton>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
});
