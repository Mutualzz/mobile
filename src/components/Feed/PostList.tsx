import { PostCard } from "@components/Feed/PostCard";
import { MediaPostCard } from "@components/Feed/MediaPostCard";
import { SnapFeedList } from "@components/Feed/SnapFeedList";
import {
  useFeedPosts,
  type FeedVariant,
} from "@components/Feed/useFeedPosts";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import { FlashList } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  variant: FeedVariant;
  snap?: boolean;
  listHeight?: number;
}

export const PostList = observer(
  ({ variant, snap = false, listHeight = 0 }: Props) => {
    const { t } = useTranslation("chat");
    const { posts, fetchMore, isFetchingNextPage, refetch, isRefetching } =
      useFeedPosts(variant);

    if (snap && listHeight > 0) {
      return <SnapFeedList variant={variant} itemHeight={listHeight} />;
    }

    const emptyLabel =
      variant === "saved"
        ? t("feed.empty.saved")
        : t("feed.empty.posts");

    return (
      <FlashList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <Box style={{ height: 12 }} />}
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
        renderItem={({ item: post }: { item: Post }) =>
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
