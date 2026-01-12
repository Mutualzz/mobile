import { Paper } from "@components/Paper";
import { FontAwesome } from "@expo/vector-icons";
import { Logger } from "@mutualzz/logger";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { MessageGroup as MessageGroupType } from "@stores/Message.store";
import type { Channel } from "@stores/objects/Channel";
import type { Space } from "@stores/objects/Space";
import { useInfiniteQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { FlatList, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageGroup } from "./MessageGroup";

interface Props {
    space?: Space | null;
    channel?: Channel | null;
}

const LIMIT = 50;

export const MessageList = observer(({ channel }: Props) => {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();

    const logger = new Logger({
        tag: "MessageList",
    });

    const messageGroups = channel?.messages.groups;

    const { fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
        {
            initialPageParam: undefined,
            queryKey: ["messages", channel?.id],
            queryFn: async ({ pageParam }: any) => {
                if (!pageParam) {
                    const count = await channel?.getMessages(true);

                    const lastGroup =
                        channel?.messages.groups[
                            channel.messages.groups.length - 1
                        ];
                    const earliestId =
                        lastGroup?.messages?.[lastGroup.messages.length - 1]
                            ?.id ?? null;
                    return { count, earliestId };
                }

                const count = await channel?.getMessages(
                    false,
                    LIMIT,
                    pageParam,
                );

                const lastGroup =
                    channel?.messages.groups[
                        channel.messages.groups.length - 1
                    ];
                const earliestId =
                    lastGroup?.messages?.[lastGroup.messages.length - 1]?.id ??
                    null;
                return { count, earliestId, before: pageParam };
            },
            getNextPageParam: (lastPage) => {
                if (lastPage?.count != null && lastPage.count < LIMIT)
                    return undefined;

                if (!lastPage?.earliestId) return undefined;

                return lastPage.earliestId;
            },
            enabled: !!channel?.id,
        },
    );

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

        logger.debug("fetching next page for channel", channel.id);
        fetchNextPage().catch((err) => {
            logger.error("Error fetching next page", err);
        });
    }, [
        messageGroups,
        hasNextPage,
        fetchNextPage,
        channel?.messages.count,
        channel?.id,
    ]);

    const renderGroup = useCallback(
        (group: MessageGroupType) => (
            <MessageGroup
                key={`messageGroup-${group.messages[group.messages.length - 1].id}`}
                group={group}
            />
        ),
        [],
    );

    const loader = isFetchingNextPage ? <></> : null;

    const totalMessages =
        channel?.messages.groups.reduce(
            (acc, g) => acc + (g.messages?.length ?? 0),
            0,
        ) ?? 0;

    return (
        <FlatList
            data={messageGroups}
            renderItem={({ item }) => renderGroup(item)}
            keyExtractor={(_, index) => `message-group-${index}`}
            onEndReached={fetchMore}
            inverted
            keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
                <Box
                    style={{
                        flexDirection: "column",
                        marginLeft: 16,
                    }}
                >
                    <Paper
                        style={{
                            width: 64,
                            height: 64,
                            padding: 4,
                            borderRadius: 9999,
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "none",
                        }}
                        elevation={10}
                    >
                        <FontAwesome
                            name="hashtag"
                            color={theme.typography.colors.muted}
                            size={36}
                        />
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
                    <Typography textColor="secondary">
                        This is the start of the #{channel?.name} channel.
                    </Typography>
                </Box>
            }
            style={{
                marginBottom: insets.bottom + 16,
                marginHorizontal: 8,
                flexDirection: "column",
            }}
        />
    );
});
