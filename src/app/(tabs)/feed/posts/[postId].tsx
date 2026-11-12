import { MediaPostCard } from "@components/Feed/MediaPostCard";
import { PostCard } from "@components/Feed/PostCard";
import { Screen } from "@components/Screen/Screen";
import { PostListSkeleton } from "@components/Skeletons";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";
import { ScrollView } from "react-native";
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
        {isLoading && !post && (
          <PostListSkeleton label={t("loading")} count={1} />
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
