import { PostCard } from "@components/Feed/PostCard";
import { MediaPostCard } from "@components/Feed/MediaPostCard";
import { useFeedPosts } from "@components/Feed/useFeedPosts";
import type { Post } from "@stores/objects/Post";
import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  type ViewToken,
} from "react-native";

interface Props {
  itemHeight: number;
}

export const SnapFeedList = observer(({ itemHeight }: Props) => {
  const { posts, fetchMore, isFetchingNextPage, refetch, isRefetching } =
    useFeedPosts("for-you");
  const [activePostId, setActivePostId] = useState<string | null>(null);

  useEffect(() => {
    if (!activePostId && posts[0]?.id) {
      setActivePostId(posts[0].id);
    }
  }, [activePostId, posts]);

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
            <Typography textColor="muted">No posts yet.</Typography>
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
