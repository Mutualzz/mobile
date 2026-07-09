import { useOpenUserProfile } from "@hooks/useOpenUserProfile";
import { GroupDMActionSheet } from "@components/DMChannel/GroupDMActionSheet";
import { GroupDMManageSheet } from "@components/DMChannel/GroupDMManageSheet";
import { UserActionSheet } from "@components/User/UserActionSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { Paper } from "@components/Paper";
import { useUserRowStyle } from "@components/userRowStyle";
import { useScaledMentionBadgeStyle, useScaledSquareSize } from "@utils/accessibilityLayout";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable } from "react-native";

interface Props {
  channel: Channel;
}

export const DMChannelItem = observer(({ channel }: Props) => {
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const openProfile = useOpenUserProfile();
  const { theme } = useTheme();
  const rowStyle = useUserRowStyle();
  const mentionBadgeStyle = useScaledMentionBadgeStyle();
  const unreadDotSize = useScaledSquareSize(8);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [groupActionOpen, setGroupActionOpen] = useState(false);
  const [manageGroupOpen, setManageGroupOpen] = useState(false);

  const active = app.channels.activeId === channel.id;
  const meId = app.account?.id;
  const recipient = channel.dmRecipient;
  const recipients = channel.dmRecipientsList;

  const readState = app.readStates.get(channel.id);
  const isUnread = readState?.isUnread ?? false;
  const mentionCount = readState?.mentionCount ?? 0;

  const relationship =
    channel.type === ChannelType.DM && recipient
      ? app.relationships.getForMe(recipient.id)
      : null;
  const iBlockedThem =
    !!relationship?.isBlocked && relationship.userId === meId;

  const title = (() => {
    if (channel.type === ChannelType.DM)
      return recipient?.displayName ?? "Deleted User";

    if (channel.name) return channel.name;

    const names = recipients.map((user) => user.displayName).filter(Boolean);

    if (!names.length) return "Group DM Channel";
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")}, +${names.length - 2}`;
  })();

  let preview: string | null = null;
  const lastMessage = channel.lastMessage;
  if (channel.isGroupDM) {
    preview = `${recipients.length} Members`;
  } else if (lastMessage && !("status" in lastMessage)) {
    preview = `${lastMessage.author?.displayName}: ${lastMessage.content}`;
  }

  const openChannel = () => {
    if (!active) {
      app.channels.setActive(channel.id);
      app.channels.setMostRecentChannelForSpace("@me", channel.id);
      navigate(`/@me/${channel.id}`);
    }

    app.setDMDrawerOpen(false);
  };

  const accessibilityLabel = `${title}${mentionCount > 0 ? `, ${mentionCount} mentions` : isUnread ? ", unread" : ""}`;

  return (
    <>
      <Pressable
        onPress={openChannel}
        onLongPress={
          channel.type === ChannelType.DM && recipient
            ? () => setActionSheetOpen(true)
            : channel.isGroupDM
              ? () => setGroupActionOpen(true)
              : undefined
        }
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: active }}
      >
      <Paper
        variant={active ? "soft" : "plain"}
        style={{
          ...rowStyle,
          marginBottom: 4,
          opacity: iBlockedThem ? 0.6 : active ? 1 : 0.94,
        }}
      >
        {recipient && channel.type === ChannelType.DM ? (
          <Pressable onPress={() => openProfile(recipient)} hitSlop={4}>
            <UserAvatar user={recipient} size="md" />
          </Pressable>
        ) : (
          <UserAvatar user={recipient ?? recipients[0]} size="md" />
        )}

        <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Typography
            level="body-sm"
            weight={active ? "bold" : "medium"}
            truncate="single"
          >
            {title}
          </Typography>
          {preview ? (
            <Typography level="body-xs" textColor="muted" truncate="single">
              {preview}
            </Typography>
          ) : null}
        </Box>

        {!active && (
          <Box
            style={{
              minWidth: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {mentionCount > 0 ? (
              <Box
                style={{
                  ...mentionBadgeStyle,
                  borderRadius: 9999,
                  backgroundColor: theme.colors.danger,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  level="body-xs"
                  style={{
                    color: "#fff",
                    fontWeight: "600",
                  }}
                >
                  {mentionCount > 99 ? "99+" : mentionCount}
                </Typography>
              </Box>
            ) : isUnread ? (
              <Box
                style={{
                  width: unreadDotSize,
                  height: unreadDotSize,
                  borderRadius: 9999,
                  backgroundColor: theme.typography.colors.primary,
                }}
              />
            ) : null}
          </Box>
        )}
      </Paper>
    </Pressable>

      {recipient && channel.type === ChannelType.DM ? (
        <UserActionSheet
          user={recipient}
          visible={actionSheetOpen}
          onClose={() => setActionSheetOpen(false)}
          insideDMs
        />
      ) : null}

      {channel.isGroupDM ? (
        <>
          <GroupDMActionSheet
            channel={channel}
            visible={groupActionOpen}
            onClose={() => setGroupActionOpen(false)}
            onOpenManage={() => setManageGroupOpen(true)}
          />
          <GroupDMManageSheet
            visible={manageGroupOpen}
            onClose={() => setManageGroupOpen(false)}
            channel={channel}
          />
        </>
      ) : null}
    </>
  );
});
