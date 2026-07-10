import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { UserAvatar } from "@components/User/UserAvatar";
import { HashIcon, ArrowDownIcon } from "phosphor-react-native";
import { Logger } from "@mutualzz/logger";
import { useAppStore } from "@hooks/useStores";
import { useOnKeyboardOpen } from "@hooks/useKeyboardOffset";
import { ChannelType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import type { MessageGroup as MessageGroupType } from "@stores/Message.store";
import type { Channel } from "@stores/objects/Channel";
import type { Space } from "@stores/objects/Space";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { MessageGroup } from "./MessageGroup";

interface Props {
  space?: Space | null;
  channel?: Channel | null;
}

const LIMIT = 50;
const SCROLL_BOTTOM_THRESHOLD = 48;
const ESTIMATED_GROUP_HEIGHT = 88;

const getDMConversationName = (channel: Channel) =>
  channel.name ||
  channel.dmRecipientsList.map((recipient) => recipient.displayName).join(", ");

const SpaceEndMessage = ({
  channel,
  canReadHistory,
  theme,
}: {
  channel: Channel | null | undefined;
  canReadHistory: boolean;
  theme: ReturnType<typeof useTheme>["theme"];
}) => {
  const app = useAppStore();
  const endIconSize = useScaledSquareSize(64);

  return (
    <Box
      style={{
        flexDirection: "column",
        marginLeft: 16,
        paddingBottom: 16,
      }}
    >
      <Paper
        style={{
          width: endIconSize,
          height: endIconSize,
          padding: 4,
          borderRadius: 9999,
          alignItems: "center",
          justifyContent: "center",
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <HashIcon size={48} color={theme.typography.colors.muted} />
      </Paper>
      <Typography
        level="h4"
        weight={700}
        style={{
          marginVertical: 8,
        }}
      >
        Welcome to #{channel?.name}!
      </Typography>
      {canReadHistory ? (
        <Typography textColor="secondary">
          This is the start of the #{channel?.name} channel.
        </Typography>
      ) : (
        <Typography textColor="secondary">
          You don&apos;t have permissions to read message history
        </Typography>
      )}
    </Box>
  );
};

const DMEndMessage = ({ channel }: { channel: Channel }) => {
  const isGroupDM = channel.type === ChannelType.GroupDM;
  const conversationName = getDMConversationName(channel);

  return (
    <Box
      style={{
        flexDirection: "column",
        marginLeft: 16,
        gap: 8,
        paddingBottom: 16,
      }}
    >
      {isGroupDM ? (
        <UserAvatar user={channel.dmRecipientsList[0]} size="lg" />
      ) : (
        <UserAvatar user={channel.dmRecipient} size="lg" />
      )}

      <Typography level="h4" weight={700}>
        {isGroupDM
          ? conversationName
          : `Send your first message to ${channel.dmRecipient?.displayName}`}
      </Typography>

      <Typography textColor="secondary">
        Welcome to the beginning of the {conversationName}
      </Typography>
    </Box>
  );
};

const ScrollToBottomFab = ({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}) => {
  if (!visible) return null;

  return (
    <Box
      style={{
        position: "absolute",
        right: 12,
        bottom: 12,
        zIndex: 2,
      }}
    >
      <IconButton
        padding={10}
        color="neutral"
        variant="soft"
        onPress={onPress}
        accessibilityLabel="Scroll to latest messages"
      >
        <ArrowDownIcon size={20} weight="bold" />
      </IconButton>
    </Box>
  );
};

export const MessageList = observer(({ channel }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const listRef = useRef<FlashListRef<MessageGroupType>>(null);
  const isAtBottomRef = useRef(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const logger = new Logger({
    tag: "MessageList",
  });

  const isDM =
    channel?.type === ChannelType.DM || channel?.type === ChannelType.GroupDM;

  const canReadHistory = isDM
    ? true
    : (channel?.space?.members.me?.hasPermission(
        "ReadMessageHistory",
        channel,
      ) ?? false);

  const rawGroups = channel?.messages.groups;

  const messageGroups = useMemo(() => {
    if (!rawGroups) return undefined;

    if (isDM || canReadHistory) return rawGroups;

    const getLastMessageId = () => {
      if (!rawGroups || rawGroups.length === 0) return undefined;
      const lastGroup = rawGroups[rawGroups.length - 1];
      if (!lastGroup.messages || lastGroup.messages.length === 0)
        return undefined;
      return lastGroup.messages[lastGroup.messages.length - 1]?.id;
    };

    const lastId = getLastMessageId();
    if (!lastId) return rawGroups;

    return rawGroups
      .map((group) => ({
        ...group,
        messages: group.messages.filter((message) => message.id !== lastId),
      }))
      .filter((group) => (group.messages?.length ?? 0) > 0);
  }, [rawGroups, isDM, canReadHistory]);

  const latestMessageId = useMemo(() => {
    if (!messageGroups?.length) return undefined;
    const newestGroup = messageGroups[0];
    return newestGroup.messages[0]?.id;
  }, [messageGroups]);

  const listData = useMemo(
    () => (messageGroups ? [...messageGroups].reverse() : []),
    [messageGroups],
  );

  const ackLatest = useCallback(() => {
    if (!channel?.id) return;

    const lastMessage = channel.lastMessage;
    if (!lastMessage || "status" in lastMessage) return;

    const readState = app.readStates.get(channel.id);
    if (readState?.isReadUpTo(lastMessage.id)) return;

    void app.readStates.ack(channel.id, lastMessage.id);
  }, [app.readStates, channel?.id, channel?.lastMessage?.id]);

  useEffect(() => {
    if (!channel?.id) return;
    ackLatest();
  }, [channel?.id, channel?.messages.groups, ackLatest]);

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: ["messages", channel?.id],
    queryFn: async ({ pageParam }: any) => {
      if (!pageParam) {
        const count = await channel?.getMessages(true);

        const lastGroup =
          channel?.messages.groups[channel.messages.groups.length - 1];
        const earliestId =
          lastGroup?.messages?.[lastGroup.messages.length - 1]?.id ?? null;
        return { count, earliestId };
      }

      const count = await channel?.getMessages(false, LIMIT, pageParam);

      const lastGroup =
        channel?.messages.groups[channel.messages.groups.length - 1];
      const earliestId =
        lastGroup?.messages?.[lastGroup.messages.length - 1]?.id ?? null;
      return { count, earliestId, before: pageParam };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.count != null && lastPage.count < LIMIT) return undefined;

      if (!lastPage?.earliestId) return undefined;

      return lastPage.earliestId;
    },
    enabled: !!channel?.id && (isDM || canReadHistory),
  });

  const scrollRafRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    },
    [],
  );

  const scrollToBottom = useCallback((animated = true) => {
    listRef.current?.scrollToEnd({ animated });
    isAtBottomRef.current = true;
    setShowScrollToBottom(false);
  }, []);

  const scheduleScrollToBottom = useCallback(
    (animated = true) => {
      if (scrollRafRef.current != null) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null;
        scrollToBottom(animated);
      });
    },
    [scrollToBottom],
  );

  const scrollToMessage = useCallback(
    async (messageId: string) => {
      if (!channel?.id) return;

      const findGroupIndex = () =>
        listData.findIndex((group) =>
          group.messages.some((message) => message.id === messageId),
        );

      let index = findGroupIndex();
      if (index < 0) {
        await channel.getMessages(false, 50, undefined, undefined, messageId);
        index = findGroupIndex();
      }

      if (index < 0) return;

      const scroll = () => {
        listRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      };

      scroll();
      requestAnimationFrame(scroll);
      app.setHighlightedMessageId(messageId);
      setTimeout(() => app.setHighlightedMessageId(null), 2000);
    },
    [app, channel, listData],
  );

  useEffect(() => {
    const request = app.jumpToMessage;
    if (!request || request.channelId !== channel?.id) return;

    app.clearJumpToMessage();
    void scrollToMessage(request.messageId);
  }, [app, app.jumpToMessage, channel?.id, scrollToMessage]);

  useEffect(() => {
    isAtBottomRef.current = true;
    setShowScrollToBottom(false);
    scheduleScrollToBottom(false);
  }, [channel?.id, scheduleScrollToBottom]);

  useEffect(() => {
    if (!isAtBottomRef.current || !latestMessageId) return;
    scheduleScrollToBottom(true);
  }, [latestMessageId, scheduleScrollToBottom]);

  const handleKeyboardOpen = useCallback(() => {
    if (!isAtBottomRef.current) return;
    scheduleScrollToBottom(true);
  }, [scheduleScrollToBottom]);

  useOnKeyboardOpen(handleKeyboardOpen);

  const fetchMore = useCallback(() => {
    if (!channel?.messages.count) {
      logger.warn("channel has no messages, aborting fetchMore!");
      return;
    }

    const lastGroup = messageGroups?.[messageGroups.length - 1];
    if (!lastGroup) {
      logger.warn("No last group found, aborting fetchMore");
      return;
    }
    if ("status" in lastGroup.messages[0]) {
      logger.debug("Last group is queued messages; ignoring fetchMore");
      return;
    }

    if (!hasNextPage) {
      logger.debug("No more pages to fetch");
      return;
    }

    if (isFetchingNextPage) return;

    logger.debug("fetching next page for channel", channel.id);
    fetchNextPage().catch((err) => {
      logger.error("Error fetching next page", err);
    });
  }, [
    messageGroups,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    channel?.messages.count,
    channel?.id,
  ]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - contentOffset.y - layoutMeasurement.height;
      const atBottom = distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD;
      isAtBottomRef.current = atBottom;
      setShowScrollToBottom(!atBottom);
    },
    [],
  );

  const renderGroup = useCallback(
    ({ item: group }: { item: MessageGroupType }) => (
      <MessageGroup
        key={`messageGroup-${group.messages[group.messages.length - 1].id}`}
        group={group}
      />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (group: MessageGroupType) =>
      `message-group-${group.messages[group.messages.length - 1].id}`,
    [],
  );

  const listHeader = useMemo(() => {
    if (!channel) return null;

    return (
      <Box>
        {isDM ? (
          <DMEndMessage channel={channel} />
        ) : (
          <SpaceEndMessage
            channel={channel}
            canReadHistory={canReadHistory}
            theme={theme}
          />
        )}
        {isFetchingNextPage && (
          <Box style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator />
          </Box>
        )}
      </Box>
    );
  }, [channel, isDM, canReadHistory, theme, isFetchingNextPage]);

  return (
    <Box style={{ flex: 1, minHeight: 0 }}>
      <FlashList
        ref={listRef}
        key={channel?.id}
        data={listData}
        renderItem={renderGroup}
        keyExtractor={keyExtractor}
        maintainVisibleContentPosition={{ startRenderingFromBottom: true }}
        drawDistance={ESTIMATED_GROUP_HEIGHT * 8}
        onContentSizeChange={() => {
          if (!isAtBottomRef.current) return;
          scheduleScrollToBottom(false);
        }}
        onStartReached={fetchMore}
        onStartReachedThreshold={0.2}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onTouchStart={() => Keyboard.dismiss()}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingTop: 8,
          paddingBottom: 8,
        }}
        style={{ flex: 1 }}
      />

      <ScrollToBottomFab
        visible={showScrollToBottom}
        onPress={() => scrollToBottom(true)}
      />
    </Box>
  );
});
