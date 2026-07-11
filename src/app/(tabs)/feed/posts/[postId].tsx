import { MediaPostCard } from "@components/Feed/MediaPostCard";
import { PostCard } from "@components/Feed/PostCard";
import { Screen } from "@components/Screen/Screen";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";
import { ActivityIndicator, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

const FeedPostDetailScreen = () => {
  const app = useAppStore();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { t } = useTranslation("chat");

  const { isLoading, isError } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => app.posts.resolve(postId, true),
    enabled: !!postId,
  });

  const post = postId ? app.posts.get(postId) : undefined;

  return (
    <Screen
      style={{
        flexDirection: "column",
        borderTopWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingVertical: 16,
        }}
      >
        {isLoading && (
          <Box style={{ padding: 24, alignItems: "center" }}>
            <ActivityIndicator />
          </Box>
        )}

        {isError && !post && (
          <Typography level="body-sm" textColor="muted">
            {t("feed.empty.postUnavailable")}
          </Typography>
        )}

        {post &&
          (post.attachments.length > 0 ? (
            <MediaPostCard post={post} defaultCommentsOpen />
          ) : (
            <PostCard post={post} defaultCommentsOpen />
          ))}
      </ScrollView>
    </Screen>
  );
};

export default observer(FeedPostDetailScreen);
