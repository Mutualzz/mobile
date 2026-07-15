import { IconButton } from "@components/IconButton";
import { ScreenHeader } from "@components/Screen/Screen";
import { UserAvatar } from "@components/User/UserAvatar";
import { ChannelType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import type { Channel } from "@stores/objects/Channel";
import {
  ArrowLeftIcon,
  DotsThreeOutlineVerticalIcon,
  UserPlusIcon,
} from "phosphor-react-native";
import { Image, Pressable } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  channel: Channel;
  onBack: () => void;
  onOpenAddRecipient?: () => void;
  onOpenManage?: () => void;
  onOpenUserMenu?: () => void;
}

export function DMChannelHeader({
  channel,
  onBack,
  onOpenAddRecipient,
  onOpenManage,
  onOpenUserMenu,
}: Props) {
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

  return (
    <ScreenHeader
      safeHorizontal={false}
      style={{
        paddingHorizontal: 12,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
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
          {subtitle && (
            <Typography level="body-xs" textColor="muted" truncate="single">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {channel.isGroupDM ? (
        <Box style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <IconButton
            padding={6}
            color="neutral"
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
            color="neutral"
            onPress={onOpenManage}
            accessibilityLabel={t("groupDm.manage.title")}
          >
            <DotsThreeOutlineVerticalIcon size={20} weight="bold" />
          </IconButton>
        </Box>
      ) : (
        onOpenUserMenu && (
          <IconButton
            padding={6}
            color="neutral"
            onPress={onOpenUserMenu}
            accessibilityLabel={t("groupDm.conversationOptionsA11y")}
          >
            <DotsThreeOutlineVerticalIcon size={20} weight="bold" />
          </IconButton>
        )
      )}
    </ScreenHeader>
  );
}
