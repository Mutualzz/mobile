import { PostCard } from "@components/Feed/PostCard";
import { MediaPostCard } from "@components/Feed/MediaPostCard";
import { useFeedPosts, type FeedVariant } from "@components/Feed/useFeedPosts";
import type { Post } from "@stores/objects/Post";
import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  type ViewToken,
} from "react-native";

interface Props {
  variant: FeedVariant;
  itemHeight: number;
}

export const SnapFeedList = observer(({ variant, itemHeight }: Props) => {
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
    itemVisiblePercentThreshold: 80,
  }).current;

  const renderItem = useCallback(
    ({ item: post }: { item: Post }) => {
      const isActive = post.id === activePostId;

      return (
        <View style={{ height: itemHeight, width: "100%" }}>
          {post.attachments.length > 0 ? (
            <MediaPostCard
              post={post}
              layout="snap"
              itemHeight={itemHeight}
              isActive={isActive}
            />
          ) : (
            <PostCard post={post} layout="snap" itemHeight={itemHeight} />
          )}
        </View>
      );
    },
    [activePostId, itemHeight],
  );

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      pagingEnabled
      decelerationRate="fast"
      snapToAlignment="start"
      disableIntervalMomentum
      showsVerticalScrollIndicator={false}
      getItemLayout={(_, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onEndReached={fetchMore}
      onEndReachedThreshold={0.6}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
      }
      ListEmptyComponent={
        !isFetchingNextPage ? (
          <Box
            style={{
              height: itemHeight,
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
            }}
          >
            <Typography textColor="muted">{emptyLabel}</Typography>
          </Box>
        ) : null
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <Box
            style={{
              height: itemHeight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator />
          </Box>
        ) : null
      }
    />
  );
});
