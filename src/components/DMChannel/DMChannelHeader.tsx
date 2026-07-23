import { IconButton } from "@components/IconButton";
import { ScreenHeader } from "@components/Screen/Screen";
import { UserAvatar } from "@components/User/UserAvatar";
import { ChannelType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import type { Channel } from "@stores/objects/Channel";
import { useAppStore } from "@hooks/useStores";
import {
  ArrowLeftIcon,
  DotsThreeOutlineVerticalIcon,
  PhoneIcon,
  UserPlusIcon,
} from "phosphor-react-native";
import { Image, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";

interface Props {
  channel: Channel;
  onBack: () => void;
  onOpenAddRecipient?: () => void;
  onOpenManage?: () => void;
  onOpenUserMenu?: () => void;
}

export const DMChannelHeader = observer(function DMChannelHeader({
  channel,
  onBack,
  onOpenAddRecipient,
  onOpenManage,
  onOpenUserMenu,
}: Props) {
  const app = useAppStore();
  const { t } = useTranslation("chat");
  const { theme } = useTheme();
  const headerIconSize = useScaledSquareSize(32);

  const title =
    channel.type === ChannelType.DM
      ? (channel.dmRecipient?.displayName ?? t("deletedUser"))
      : (channel.name ??
          channel.dmRecipients
            .map((user) => user.displayName)
            .filter(Boolean)
            .join(", ")) ||
        t("groupDm.title");

  const subtitle = channel.isGroupDM
    ? `${channel.dmRecipientsList.length} ${t("groupDm.manage.members")}`
    : channel.dmRecipient
      ? `@${channel.dmRecipient.username}`
      : null;

  const isFull = (channel.recipientIds?.length ?? 0) >= 10;
  const callActive = app.calls.isActive(channel.id);
  const inThisCall =
    app.voice.currentChannelId === channel.id &&
    app.voice.connectionStatus !== "idle";
  const ringingForMe = app.calls.isRingingForMe(channel.id);
  const outgoing = app.calls.isOutgoing(channel.id);
  const participantCount = Array.from(channel.voiceStates.values()).length;

  const callStatus = !callActive
    ? null
    : ringingForMe
      ? t("call.incoming")
      : outgoing
        ? t("call.calling")
        : inThisCall
          ? t("call.inCall")
          : t("call.active");

  const shownSubtitle = callStatus
    ? participantCount > 0
      ? `${callStatus} · ${participantCount}`
      : callStatus
    : subtitle;

  return (
    <ScreenHeader
      safeHorizontal={false}
      elevation={theme.backgroundImageUrl ? 0 : undefined}
      style={{
        paddingHorizontal: 12,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        ...(theme.backgroundImageUrl
          ? { backgroundColor: "transparent" }
          : null),
      }}
    >
      <Pressable hitSlop={8} onPress={onBack}>
        <ArrowLeftIcon
          size={22}
          weight="bold"
          color={theme.typography.colors.primary}
        />
      </Pressable>

      <Box
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginLeft: 10,
        }}
      >
        {channel.isGroupDM && channel.iconUrl ? (
          <Image
            source={{ uri: channel.iconUrl }}
            style={{
              width: headerIconSize,
              height: headerIconSize,
              borderRadius: channel.flags.has("RoundedIcon")
                ? headerIconSize / 2
                : headerIconSize / 4,
            }}
          />
        ) : (
          <UserAvatar
            user={
              channel.type === ChannelType.DM
                ? (channel.dmRecipient ?? null)
                : (channel.dmRecipientsList[0] ?? null)
            }
            size={headerIconSize}
          />
        )}

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Typography weight={700} truncate="single">
            {title}
          </Typography>
          {shownSubtitle && (
            <Typography level="body-xs" textColor="muted" truncate="single">
              {shownSubtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <Box style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        <IconButton
          padding={6}
          color={callActive || inThisCall ? "success" : undefined}
          disabled={inThisCall}
          accessibilityLabel={
            inThisCall
              ? t("call.inCall")
              : callActive
                ? t("call.join")
                : t("call.start")
          }
          onPress={() => {
            if (inThisCall) return;
            if (ringingForMe) {
              void app.calls.accept(channel.id);
              return;
            }
            if (callActive) {
              void app.voice.join({
                spaceId: null,
                channelId: channel.id,
              });
              return;
            }
            void app.calls.startCall(channel.id, { silent: false });
          }}
          onLongPress={() => {
            if (inThisCall || callActive) return;
            void app.calls.startCall(channel.id, { silent: true });
          }}
        >
          <PhoneIcon size={20} weight="fill" />
        </IconButton>
        {channel.isGroupDM ? (
          <>
            <IconButton
              padding={6}
              onPress={onOpenAddRecipient}
              disabled={isFull}
              accessibilityLabel={
                isFull ? t("header.dm.groupFull") : t("header.dm.addToGroup")
              }
            >
              <UserPlusIcon size={20} weight="fill" />
            </IconButton>
            <IconButton
              padding={6}
              onPress={onOpenManage}
              accessibilityLabel={t("groupDm.manage.title")}
            >
              <DotsThreeOutlineVerticalIcon size={20} weight="bold" />
            </IconButton>
          </>
        ) : (
          onOpenUserMenu && (
            <IconButton
              padding={6}
              onPress={onOpenUserMenu}
              accessibilityLabel={t("groupDm.conversationOptionsA11y")}
            >
              <DotsThreeOutlineVerticalIcon size={20} weight="bold" />
            </IconButton>
          )
        )}
      </Box>
    </ScreenHeader>
  );
});
