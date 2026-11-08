import { SpaceIcon } from "@components/Space/SpaceIcon";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, Paper, Typography, useTheme } from "@mutualzz/ui-native";
import type { AppStore } from "@stores/App.store";
import type { Channel } from "@stores/objects/Channel";
import type { TFunction } from "i18next";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

export type InboxTab =
  | "forYou"
  | "unreads"
  | "mentions"
  | "bookmarks"
  | "reminders"
  | "scheduled";

export const formatInboxTime = (time: Date | string | number) => {
  const date = new Date(time);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay)
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const formatScheduleTime = (time: Date | string) =>
  new Date(time).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const channelLocationLabel = (
  channel: Channel | undefined,
  translate: TFunction,
) => {
  if (!channel) return translate("chat:unknown");
  if (channel.space) return `${channel.space.name} · #${channel.name}`;
  if (channel.type === ChannelType.DM)
    return channel.dmRecipient?.displayName ?? translate("chat:deletedUser");
  return (
    channel.name ||
    channel.dmRecipientsList.map((user) => user.displayName).join(", ")
  );
};

export const channelCardTitle = (
  channel: Channel | undefined,
  translate: TFunction,
) =>
  channel?.space
    ? `#${channel.name}`
    : channelLocationLabel(channel, translate);

export const getUnreadDirectChannels = (app: AppStore) =>
  app.channels.dms.filter(
    (channel) => app.readStates.get(channel.id)?.isUnread ?? false,
  );

export const getMentionedSpaceChannels = (app: AppStore) =>
  app.channels.all.filter(
    (channel) =>
      !!channel.spaceId &&
      (app.readStates.get(channel.id)?.displayMentionCount ?? 0) > 0,
  );

export const useInboxCount = () => {
  const app = useAppStore();
  return (
    getUnreadDirectChannels(app).length +
    getMentionedSpaceChannels(app).length +
    app.relationships.getIncoming().length +
    app.notifications.unreadCount
  );
};

export const useOpenChannel = () => {
  const app = useAppStore();
  const { navigate } = useAppNavigation();

  return (channelId: string, messageId?: string) => {
    const channel = app.channels.get(channelId);
    if (!channel) return;

    if (channel.space) {
      app.channels.setActive(channel.id);
      navigate(`/spaces/channel/${channel.id}`);
    } else navigate(`/@me/${channel.id}`);

    if (messageId) app.requestJumpToMessage(channelId, messageId);
  };
};

export const CountBadge = ({
  count,
  style,
}: {
  count: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const { theme } = useTheme();
  if (count <= 0) return null;

  return (
    <Box
      style={[
        {
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          paddingHorizontal: 4,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.danger,
        },
        style,
      ]}
    >
      <Typography level="body-xs" style={{ color: "#fff", fontSize: 10 }}>
        {count > 99 ? "99+" : count}
      </Typography>
    </Box>
  );
};

export const ChannelAvatar = observer(
  ({ channel }: { channel: Channel | undefined }) => {
    if (!channel) return null;
    if (channel.space) return <SpaceIcon space={channel.space} size={32} />;
    return (
      <UserAvatar
        user={channel.dmRecipient ?? channel.dmRecipientsList[0]}
        size="md"
      />
    );
  },
);

export const InboxCard = ({
  icon,
  title,
  subtitle,
  actions,
  onPress,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onPress?: () => void;
  children?: ReactNode;
}) => {
  const { theme } = useTheme();

  return (
    <Paper
      elevation={1}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: `${theme.colors.neutral}40`,
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: 12,
        }}
      >
        {icon}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Typography level="body-sm" weight="bold" truncate="single">
            {title}
          </Typography>
          {subtitle ? (
            <Typography level="body-xs" textColor="muted" truncate="single">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {actions ? (
          <Box style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {actions}
          </Box>
        ) : null}
      </Pressable>
      {children}
    </Paper>
  );
};

export const InboxEmptyState = ({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}) => {
  const { theme } = useTheme();

  return (
    <Box
      style={{
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 24,
        paddingVertical: 48,
      }}
    >
      <Box
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.surface,
        }}
      >
        {icon}
        <Box
          style={{
            position: "absolute",
            top: 6,
            right: -2,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: theme.colors.info,
          }}
        />
        <Box
          style={{
            position: "absolute",
            bottom: 10,
            left: -6,
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: theme.colors.warning,
          }}
        />
      </Box>
      <Typography level="body-lg" weight="bold" style={{ textAlign: "center" }}>
        {title}
      </Typography>
      <Typography
        level="body-sm"
        textColor="muted"
        style={{ textAlign: "center" }}
      >
        {description}
      </Typography>
    </Box>
  );
};
