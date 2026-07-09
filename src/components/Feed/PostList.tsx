import { PostCard } from "@components/Feed/PostCard";
import { MediaPostCard } from "@components/Feed/MediaPostCard";
import { PostComposer } from "@components/Feed/PostComposer";
import { SnapFeedList } from "@components/Feed/SnapFeedList";
import { useFeedPosts } from "@components/Feed/useFeedPosts";
import { Box, Typography } from "@mutualzz/ui-native";
import { FlashList } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import { ActivityIndicator } from "react-native";

interface Props {
  variant: "friends" | "for-you" | "saved";
  showComposer?: boolean;
  snap?: boolean;
  listHeight?: number;
}

export const PostList = observer(
  ({ variant, showComposer, snap = false, listHeight = 0 }: Props) => {
    if (snap && variant === "for-you" && listHeight > 0) {
      return <SnapFeedList itemHeight={listHeight} />;
    }

    const { posts, fetchMore, isFetchingNextPage, refetch } =
      useFeedPosts(variant);

    const emptyLabel =
      variant === "saved" ? "No saved posts yet." : "No posts yet.";

    return (
      <FlashList
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
