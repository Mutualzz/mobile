import { PostCard } from "@components/Feed/PostCard";
import { MediaPostCard } from "@components/Feed/MediaPostCard";
import {
  useFeedPosts,
  type FeedVariant,
} from "@components/Feed/useFeedPosts";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import { FEED_COLUMN_MAX_WIDTH } from "@utils/feedLayout";
import { FlashList } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, type ViewToken } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  variant: FeedVariant;
}

export const PostList = observer(({ variant }: Props) => {
  const { t } = useTranslation("chat");
  const { posts, fetchMore, isFetchingNextPage, refetch, isRefetching } =
    useFeedPosts(variant);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  const emptyLabel =
    variant === "saved" ? t("feed.empty.saved") : t("feed.empty.posts");

  useEffect(() => {
    if (!activePostId && posts[0]?.id) {
      setActivePostId(posts[0].id);
    }
  }, [activePostId, posts]);

  useEffect(() => {
    setActivePostId(null);
  }, [variant]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Post>[] }) => {
      const primary = viewableItems.find((entry) => entry.isViewable)?.item;
      if (primary?.id) setActivePostId(primary.id);
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  return (
    <FlashList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        paddingHorizontal: 12,
        paddingBottom: 24,
        paddingTop: 4,
      }}
      ItemSeparatorComponent={() => <Box style={{ height: 10 }} />}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      ListEmptyComponent={
        !isFetchingNextPage ? (
          <Box style={{ padding: 32, alignItems: "center" }}>
            <Typography textColor="muted">{emptyLabel}</Typography>
          </Box>
        ) : null
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <Box style={{ padding: 16, alignItems: "center" }}>
            <ActivityIndicator />
          </Box>
        ) : null
      }
      onEndReached={fetchMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
        />
      }
      renderItem={({ item: post }: { item: Post }) => (
        <Box style={{ width: "100%", maxWidth: FEED_COLUMN_MAX_WIDTH, alignSelf: "center" }}>
          {post.attachments.length > 0 ? (
            <MediaPostCard
              post={post}
              isActive={post.id === activePostId}
            />
          ) : (
            <PostCard post={post} />
          )}
        </Box>
      )}
    />
  );
});
