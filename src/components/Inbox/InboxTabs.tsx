import { IconButton } from "@components/IconButton";
import { PinnedMessageCard } from "@components/Channel/PinnedMessageCard";
import { ScheduledPostCard } from "@components/Feed/ScheduledPostCard";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { useSheet } from "@hooks/useSheet";
import {
  MESSAGE_SCHEDULE_PRESETS,
  resolveMessageSchedulePreset,
} from "@mutualzz/client";
import { PickTimeSheet, schedulePresetLabel } from "./PickTimeSheet";
import { EditScheduledSheet } from "./EditScheduledSheet";
import type { APIMessage, APINotification } from "@mutualzz/types";
import { Box, Button, Typography, useTheme } from "@mutualzz/ui-native";
import {
  type InfiniteData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import {
  AlarmIcon,
  AtIcon,
  BellIcon,
  BookmarkSimpleIcon,
  CheckIcon,
  PaperPlaneTiltIcon,
  TrayIcon,
  WarningCircleIcon,
  XIcon,
} from "phosphor-react-native";
import { type ReactNode, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable } from "react-native";
import {
  ChannelAvatar,
  channelCardTitle,
  channelLocationLabel,
  formatInboxTime,
  formatScheduleTime,
  getMentionedSpaceChannels,
  getUnreadDirectChannels,
  InboxCard,
  InboxEmptyState,
  type InboxTab,
  useOpenChannel,
} from "./InboxParts";

interface MentionsPage {
  messages: APIMessage[];
  hasMore: boolean;
  nextBefore: string | null;
}

const useIconColor = () => useTheme().theme.colors.primary;

const BoldText = <Typography weight="bold" level="body-sm" />;

const SectionLabel = ({ children }: { children: string }) => (
  <Typography
    level="body-xs"
    textColor="muted"
    weight="bold"
    style={{ textTransform: "uppercase", letterSpacing: 0.4 }}
  >
    {children}
  </Typography>
);

const Loading = () => (
  <Box style={{ padding: 24, alignItems: "center" }}>
    <ActivityIndicator />
  </Box>
);

const IconBubble = ({ children }: { children: ReactNode }) => {
  const { theme } = useTheme();
  return (
    <Box
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.surface,
      }}
    >
      {children}
    </Box>
  );
};

const NotificationEntry = observer(
  ({
    notification,
    isNew,
    onSelectTab,
  }: {
    notification: APINotification;
    isNew: boolean;
    onSelectTab: (tab: InboxTab) => void;
  }) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const iconColor = useIconColor();
    const { t } = useTranslation("common");
    const openChannel = useOpenChannel();

    const location = notification.channelId
      ? channelLocationLabel(app.channels.get(notification.channelId), t)
      : "";
    const actor = notification.actorId
      ? app.users.get(notification.actorId)
      : undefined;

    const content = ((): {
      leading: ReactNode;
      text: string;
      onPress?: () => void;
    } | null => {
      const openTarget = () =>
        notification.channelId &&
        openChannel(
          notification.channelId,
          notification.messageId ?? undefined,
        );

      switch (notification.type) {
        case "friend_accepted":
          if (!actor) return null;
          return {
            leading: <UserAvatar user={actor} size="md" />,
            text: t("notifications.acceptedFriend", {
              name: actor.displayName,
            }),
          };
        case "reminder":
          return {
            leading: (
              <IconBubble>
                <AlarmIcon size={18} weight="fill" color={iconColor} />
              </IconBubble>
            ),
            text: t("notifications.reminderEntry", { location }),
            onPress: openTarget,
          };
        case "scheduled_sent":
          return {
            leading: (
              <IconBubble>
                <PaperPlaneTiltIcon size={18} weight="fill" color={iconColor} />
              </IconBubble>
            ),
            text: t("notifications.scheduledSentEntry", { location }),
            onPress: openTarget,
          };
        case "scheduled_failed":
          return {
            leading: (
              <IconBubble>
                <WarningCircleIcon size={18} weight="fill" color={iconColor} />
              </IconBubble>
            ),
            text: t("notifications.scheduledFailedEntry", {
              location,
              reason: notification.data.reason ?? "",
            }),
            onPress: () => onSelectTab("scheduled"),
          };
      }
    })();

    if (!content) return null;

    return (
      <Pressable
        onPress={content.onPress}
        disabled={!content.onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 10,
        }}
      >
        {content.leading}
        <Typography level="body-sm" style={{ flex: 1 }}>
          {content.text}
        </Typography>
        <Typography level="body-xs" textColor="muted">
          {formatInboxTime(notification.createdAt)}
        </Typography>
        {isNew && (
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.colors.primary,
            }}
          />
        )}
        <IconButton
          variant="plain"
          padding={4}
          onPress={() => app.notifications.dismiss(notification.id)}
          accessibilityLabel={t("notifications.dismiss")}
        >
          <XIcon size={14} />
        </IconButton>
      </Pressable>
    );
  },
);

export const ForYouTab = observer(
  ({ onSelectTab }: { onSelectTab: (tab: InboxTab) => void }) => {
    const app = useAppStore();
    const { t } = useTranslation("common");
    const { t: tChat } = useTranslation("chat");
    const iconColor = useIconColor();
    const [newIds] = useState(
      () =>
        new Set(
          app.notifications.all
            .filter((notification) => !notification.readAt)
            .map((notification) => notification.id),
        ),
    );

    useEffect(() => {
      if (!app.notifications.loaded) void app.notifications.load();
    }, [app.notifications]);

    useEffect(() => {
      app.notifications.markAllRead();
    }, [app.notifications, app.notifications.unreadCount]);

    const incoming = app.relationships.getIncoming();
    const notifications = app.notifications.all;
    for (const notification of notifications)
      if (!notification.readAt) newIds.add(notification.id);

    if (!app.notifications.loaded && incoming.length === 0) return <Loading />;

    if (incoming.length === 0 && notifications.length === 0)
      return (
        <InboxEmptyState
          icon={<BellIcon size={40} weight="duotone" color={iconColor} />}
          title={t("notifications.emptyForYouTitle")}
          description={t("notifications.emptyForYouDescription")}
        />
      );

    return (
      <Box style={{ gap: 16 }}>
        {incoming.length > 0 && (
          <Box style={{ gap: 8 }}>
            <SectionLabel>{t("notifications.friendRequests")}</SectionLabel>
            {incoming.map((relationship) => {
              const userId = relationship.otherUserIdForMe;
              const user = userId ? app.users.get(userId) : undefined;
              if (!userId || !user) return null;
              return (
                <Box
                  key={relationship.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <UserAvatar user={user} size="md" />
                  <Typography
                    level="body-sm"
                    style={{ flex: 1 }}
                    truncate="single"
                  >
                    {user.displayName}
                  </Typography>
                  <Button
                    size="sm"
                    color="success"
                    onPress={() =>
                      void app.relationships.acceptFriendRequest(userId)
                    }
                  >
                    {tChat("contextMenu.acceptFriendRequest")}
                  </Button>
                  <Button
                    size="sm"
                    variant="soft"
                    onPress={() =>
                      void app.relationships.declineFriendRequest(userId)
                    }
                  >
                    {tChat("contextMenu.declineFriendRequest")}
                  </Button>
                </Box>
              );
            })}
          </Box>
        )}
        {notifications.length > 0 && (
          <Box>
            {notifications.map((notification) => (
              <NotificationEntry
                key={notification.id}
                notification={notification}
                isNew={newIds.has(notification.id)}
                onSelectTab={onSelectTab}
              />
            ))}
          </Box>
        )}
        {app.notifications.hasMore && (
          <Button
            size="sm"
            variant="plain"
            disabled={app.notifications.loading}
            onPress={() => void app.notifications.loadMore()}
          >
            {t("notifications.loadMore")}
          </Button>
        )}
      </Box>
    );
  },
);

export const UnreadsTab = observer(() => {
  const app = useAppStore();
  const { t } = useTranslation("common");
  const iconColor = useIconColor();
  const openChannel = useOpenChannel();

  const channels = [
    ...getUnreadDirectChannels(app),
    ...getMentionedSpaceChannels(app),
  ];

  if (channels.length === 0)
    return (
      <InboxEmptyState
        icon={<TrayIcon size={40} weight="duotone" color={iconColor} />}
        title={t("notifications.emptyUnreadsTitle")}
        description={t("notifications.emptyUnreadsDescription")}
      />
    );

  const markRead = (channelId: string) => {
    const lastMessage = app.channels.get(channelId)?.lastMessage;
    if (lastMessage) void app.readStates.ack(channelId, lastMessage.id);
  };

  return (
    <Box style={{ gap: 10 }}>
      <Button
        size="sm"
        variant="soft"
        onPress={() => channels.forEach((channel) => markRead(channel.id))}
      >
        {t("notifications.markAllAsRead")}
      </Button>
      {channels.map((channel) => {
        const mentionCount =
          app.readStates.get(channel.id)?.displayMentionCount ?? 0;
        const preview = channel.lastMessage?.content?.trim();
        return (
          <InboxCard
            key={channel.id}
            icon={<ChannelAvatar channel={channel} />}
            title={channelCardTitle(channel, t)}
            subtitle={
              channel.space
                ? channel.space.name
                : preview || t("notifications.sentAttachment")
            }
            onPress={() => openChannel(channel.id)}
            actions={
              <>
                {mentionCount > 0 && (
                  <Typography level="body-xs" weight="bold">
                    @{mentionCount}
                  </Typography>
                )}
                <IconButton
                  variant="soft"
                  padding={6}
                  onPress={() => markRead(channel.id)}
                  accessibilityLabel={t("notifications.markAllAsRead")}
                >
                  <CheckIcon size={14} weight="bold" />
                </IconButton>
              </>
            }
          />
        );
      })}
    </Box>
  );
});

export const MentionsTab = observer(() => {
  const app = useAppStore();
  const { t } = useTranslation("common");
  const iconColor = useIconColor();
  const openChannel = useOpenChannel();
  const [includeEveryone, setIncludeEveryone] = useState(true);
  const [includeRoles, setIncludeRoles] = useState(true);

  const queryKey = ["mentions", includeEveryone, includeRoles, "all"];

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam }) =>
        app.gateway.listMentions({
          before: pageParam,
          includeEveryone,
          includeRoles,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? (lastPage.nextBefore ?? undefined) : undefined,
      staleTime: 30_000,
    });

  const messages = data?.pages.flatMap((page) => page.messages) ?? [];

  const dismiss = (messageId: string) => {
    app.queryClient.setQueriesData<
      InfiniteData<MentionsPage, string | undefined>
    >({ queryKey: ["mentions"] }, (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              messages: page.messages.filter(
                (message) => message.id !== messageId,
              ),
            })),
          }
        : current,
    );
    void app.gateway.dismissMention(messageId);
  };

  return (
    <Box style={{ gap: 10 }}>
      <Box style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        <Button
          size="sm"
          variant={includeEveryone ? "soft" : "plain"}
          onPress={() => setIncludeEveryone(!includeEveryone)}
        >
          {t("notifications.filterEveryone")}
        </Button>
        <Button
          size="sm"
          variant={includeRoles ? "soft" : "plain"}
          onPress={() => setIncludeRoles(!includeRoles)}
        >
          {t("notifications.filterRoles")}
        </Button>
      </Box>

      {isLoading && <Loading />}

      {!isLoading && messages.length === 0 && (
        <InboxEmptyState
          icon={<AtIcon size={40} weight="duotone" color={iconColor} />}
          title={t("notifications.emptyMentionsTitle")}
          description={t("notifications.emptyMentionsDescription")}
        />
      )}

      {messages.map((message) => {
        const channel = app.channels.get(message.channelId);
        return (
          <InboxCard
            key={message.id}
            icon={<ChannelAvatar channel={channel} />}
            title={channelCardTitle(channel, t)}
            subtitle={channel?.space?.name}
            actions={
              <IconButton
                variant="soft"
                padding={6}
                onPress={() => dismiss(message.id)}
                accessibilityLabel={t("notifications.removeMention")}
              >
                <CheckIcon size={14} weight="bold" />
              </IconButton>
            }
          >
            <PinnedMessageCard
              message={message}
              space={channel?.space}
              onJump={() => openChannel(message.channelId, message.id)}
            />
          </InboxCard>
        );
      })}

      {hasNextPage && (
        <Button
          size="sm"
          variant="plain"
          disabled={isFetchingNextPage}
          onPress={() => void fetchNextPage()}
        >
          {t("notifications.loadMore")}
        </Button>
      )}
    </Box>
  );
});

export const BookmarksTab = observer(() => {
  const app = useAppStore();
  const { t } = useTranslation("common");
  const iconColor = useIconColor();
  const openChannel = useOpenChannel();

  const { data = [], isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => app.gateway.listBookmarks(),
    staleTime: 30_000,
    enabled: app.bookmarks.size > 0,
  });

  if (app.bookmarks.size === 0)
    return (
      <InboxEmptyState
        icon={
          <BookmarkSimpleIcon size={40} weight="duotone" color={iconColor} />
        }
        title={t("notifications.emptyBookmarksTitle")}
        description={
          <Trans
            t={t}
            i18nKey="notifications.emptyBookmarksDescription"
            components={{ bold: BoldText }}
          />
        }
      />
    );

  if (isLoading) return <Loading />;

  const bookmarks = data.filter((bookmark) =>
    app.bookmarks.has(bookmark.messageId),
  );

  return (
    <Box style={{ gap: 10 }}>
      {bookmarks.map((bookmark) => {
        const channel = app.channels.get(bookmark.channelId);
        return (
          <InboxCard
            key={bookmark.messageId}
            icon={<ChannelAvatar channel={channel} />}
            title={channelCardTitle(channel, t)}
            subtitle={channel?.space?.name}
            actions={
              <IconButton
                variant="soft"
                padding={6}
                onPress={() => void app.bookmarks.toggle(bookmark.messageId)}
                accessibilityLabel={t("notifications.removeBookmark")}
              >
                <XIcon size={14} weight="bold" />
              </IconButton>
            }
          >
            <PinnedMessageCard
              message={bookmark.message}
              space={channel?.space}
              onJump={() => openChannel(bookmark.channelId, bookmark.messageId)}
            />
          </InboxCard>
        );
      })}
    </Box>
  );
});

export const RemindersTab = observer(() => {
  const app = useAppStore();
  const { t } = useTranslation("common");
  const iconColor = useIconColor();
  const openChannel = useOpenChannel();

  const { data = [], isLoading } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => app.gateway.listReminders(),
    staleTime: 30_000,
    enabled: app.reminders.size > 0,
  });

  if (app.reminders.size === 0)
    return (
      <InboxEmptyState
        icon={<AlarmIcon size={40} weight="duotone" color={iconColor} />}
        title={t("notifications.emptyRemindersTitle")}
        description={
          <Trans
            t={t}
            i18nKey="notifications.emptyRemindersDescription"
            components={{ bold: BoldText }}
          />
        }
      />
    );

  if (isLoading) return <Loading />;

  const messagesById = new Map(
    data.map((reminder) => [reminder.messageId, reminder.message]),
  );

  return (
    <Box style={{ gap: 10 }}>
      {app.reminders.all
        .filter((reminder) => messagesById.has(reminder.messageId))
        .map((reminder) => {
          const channel = app.channels.get(reminder.channelId);
          return (
            <InboxCard
              key={reminder.messageId}
              icon={<ChannelAvatar channel={channel} />}
              title={channelCardTitle(channel, t)}
              subtitle={
                reminder.firedAt
                  ? t("notifications.reminderDueNow")
                  : t("notifications.reminderAt", {
                      time: formatScheduleTime(reminder.remindAt),
                    })
              }
              actions={
                <IconButton
                  variant="soft"
                  padding={6}
                  onPress={() =>
                    void app.reminders.complete(reminder.messageId)
                  }
                  accessibilityLabel={t("notifications.markReminderDone")}
                >
                  <CheckIcon size={14} weight="bold" />
                </IconButton>
              }
            >
              <PinnedMessageCard
                message={messagesById.get(reminder.messageId)!}
                space={channel?.space}
                onJump={() =>
                  openChannel(reminder.channelId, reminder.messageId)
                }
              />
            </InboxCard>
          );
        })}
    </Box>
  );
});

export const ScheduledTab = observer(() => {
  const app = useAppStore();
  useQuery({
    queryKey: ["posts", "scheduled"],
    queryFn: () => app.posts.getScheduledFeed(),
    staleTime: 30_000,
  });
  const { t } = useTranslation("common");
  const { t: tChat } = useTranslation("chat");
  const iconColor = useIconColor();
  const scheduledMessages = app.scheduledMessages.all;
  const { openSheet } = useSheet();

  const openReschedule = (id: string) => {
    const current = app.scheduledMessages.get(id);
    if (!current) return;
    const sheetId = `reschedule-${id}`;
    openSheet(
      sheetId,
      <PickTimeSheet
        sheetId={sheetId}
        title={tChat("scheduledMessages.rescheduleTitle")}
        confirmLabel={tChat("scheduledMessages.reschedule")}
        initial={new Date(current.scheduledFor)}
        presets={MESSAGE_SCHEDULE_PRESETS.map((preset) => {
          const time = resolveMessageSchedulePreset(preset);
          return {
            key: preset,
            label: schedulePresetLabel(t, preset, time),
            time,
          };
        })}
        onConfirm={async (time) =>
          (await app.scheduledMessages.edit(id, { scheduledFor: time })).ok
        }
      />,
    );
  };

  const scheduledPosts = app.posts.all
    .filter((post) => post.isScheduled)
    .slice()
    .sort(
      (first, second) =>
        (first.scheduledFor?.getTime() ?? 0) -
        (second.scheduledFor?.getTime() ?? 0),
    );

  if (scheduledMessages.length === 0 && scheduledPosts.length === 0)
    return (
      <InboxEmptyState
        icon={
          <PaperPlaneTiltIcon size={40} weight="duotone" color={iconColor} />
        }
        title={t("notifications.emptyScheduledTitle")}
        description={
          <Trans
            t={t}
            i18nKey="notifications.emptyScheduledDescription"
            components={{ bold: BoldText }}
          />
        }
      />
    );

  return (
    <Box style={{ gap: 10 }}>
      {scheduledMessages.length > 0 && (
        <SectionLabel>{tChat("scheduledMessages.messages")}</SectionLabel>
      )}
      {scheduledMessages.map((scheduled) => {
        const channel = app.channels.get(scheduled.channelId);
        const isFailed = scheduled.status === "failed";
        const isSending = scheduled.status === "sending";
        return (
          <InboxCard
            key={scheduled.id}
            icon={<ChannelAvatar channel={channel} />}
            title={channelCardTitle(channel, t)}
            subtitle={
              isSending
                ? tChat("scheduledMessages.sending")
                : tChat("scheduledMessages.sendsAt", {
                    time: formatScheduleTime(scheduled.scheduledFor),
                  })
            }
          >
            <Box style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
              {scheduled.content ? (
                <Typography level="body-sm">{scheduled.content}</Typography>
              ) : null}
              {scheduled.attachments.length > 0 && (
                <Typography level="body-xs" textColor="muted">
                  {tChat("scheduledMessages.attachmentCount", {
                    count: scheduled.attachments.length,
                  })}
                </Typography>
              )}
              {isFailed && (
                <Typography level="body-xs" weight="bold">
                  {tChat("scheduledMessages.failed", {
                    reason: scheduled.failureReason ?? "",
                  })}
                </Typography>
              )}
              {!isSending && (
                <Box style={{ flexDirection: "row", gap: 6 }}>
                  <Button
                    size="sm"
                    variant="soft"
                    onPress={() =>
                      void app.scheduledMessages.sendNow(scheduled.id)
                    }
                  >
                    {isFailed
                      ? tChat("scheduledMessages.retry")
                      : tChat("scheduledMessages.sendNow")}
                  </Button>
                  <Button
                    size="sm"
                    variant="plain"
                    onPress={() => openReschedule(scheduled.id)}
                  >
                    {tChat("scheduledMessages.reschedule")}
                  </Button>
                  <Button
                    size="sm"
                    variant="plain"
                    onPress={() => {
                      const sheetId = `edit-scheduled-${scheduled.id}`;
                      openSheet(
                        sheetId,
                        <EditScheduledSheet
                          sheetId={sheetId}
                          scheduledMessageId={scheduled.id}
                        />,
                      );
                    }}
                  >
                    {tChat("scheduledMessages.editText")}
                  </Button>
                  <Button
                    size="sm"
                    variant="plain"
                    color="danger"
                    onPress={() =>
                      void app.scheduledMessages.cancel(scheduled.id)
                    }
                  >
                    {tChat("scheduledMessages.cancel")}
                  </Button>
                </Box>
              )}
            </Box>
          </InboxCard>
        );
      })}
      {scheduledPosts.length > 0 && (
        <SectionLabel>{tChat("scheduledMessages.posts")}</SectionLabel>
      )}
      {scheduledPosts.map((post) => (
        <ScheduledPostCard key={post.id} post={post} />
      ))}
    </Box>
  );
});
