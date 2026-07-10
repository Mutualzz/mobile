import { PostCard } from "@components/Feed/PostCard";
import { MediaPostCard } from "@components/Feed/MediaPostCard";
import { PostComposer } from "@components/Feed/PostComposer";
import { SnapFeedList } from "@components/Feed/SnapFeedList";
import { useFeedPosts } from "@components/Feed/useFeedPosts";
import { useKeyboardOffset } from "@hooks/useKeyboardOffset";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { ActivityIndicator, RefreshControl } from "react-native";

interface Props {
  variant: "friends" | "for-you" | "saved";
  showComposer?: boolean;
  snap?: boolean;
  listHeight?: number;
}

export const PostList = observer(
  ({ variant, showComposer, snap = false, listHeight = 0 }: Props) => {
    const isSnapFeed = snap && variant === "for-you" && listHeight > 0;
    const { posts, fetchMore, isFetchingNextPage, refetch, isRefetching } =
      useFeedPosts(variant);
    const listRef = useRef<FlashListRef<Post>>(null);
    const keyboardHeight = useKeyboardOffset();

    useEffect(() => {
      if (!showComposer || keyboardHeight <= 0) return;

      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    }, [keyboardHeight, showComposer]);

    if (isSnapFeed) {
      return <SnapFeedList itemHeight={listHeight} />;
    }

    const emptyLabel =
      variant === "saved" ? "No saved posts yet." : "No posts yet.";

    return (
      <FlashList
        ref={listRef}
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <Box style={{ height: 12 }} />}
        ListHeaderComponent={
          showComposer ? (
            <Box style={{ marginBottom: 12 }}>
              <PostComposer onPosted={() => refetch()} />
            </Box>
          ) : null
        }
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
        renderItem={({ item: post }) =>
          post.attachments.length > 0 ? (
            <MediaPostCard post={post} />
          ) : (
            <PostCard post={post} />
          )
        }
      />
    );
  },
);
