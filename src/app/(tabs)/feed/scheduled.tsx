import { FeedHeader } from "@components/Feed/FeedHeader";
import { ScheduledPostCard } from "@components/Feed/ScheduledPostCard";
import { Screen } from "@components/Screen/Screen";
import { useKeyboardChromeInset } from "@hooks/useKeyboardChromeInset";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { ActivityIndicator, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

const FeedScheduledScreen = () => {
  const app = useAppStore();
  const { t } = useTranslation("chat");
  const tabBarInset = useKeyboardChromeInset();

  const { isLoading } = useQuery({
    queryKey: ["posts", "scheduled"],
    queryFn: () => app.posts.getScheduledFeed(),
  });

  const scheduledPosts = app.posts.all
    .filter((post) => post.isScheduled)
    .slice()
    .sort(
      (a, b) =>
        (a.scheduledFor?.getTime() ?? 0) - (b.scheduledFor?.getTime() ?? 0),
    );

  return (
    <Screen
      style={{
        flexDirection: "column",
        paddingBottom: tabBarInset,
        borderTopWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
      }}
    >
      <FeedHeader />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingBottom: 24,
          gap: 12,
        }}
      >
        <Typography level="body-lg" weight={700}>
          {t("feed.scheduled.title")}
        </Typography>

        {isLoading && (
          <Box style={{ padding: 24, alignItems: "center" }}>
            <ActivityIndicator />
          </Box>
        )}

        {!isLoading && scheduledPosts.length === 0 && (
          <Typography level="body-sm" textColor="muted">
            {t("feed.empty.scheduled")}
          </Typography>
        )}

        {scheduledPosts.map((post) => (
          <ScheduledPostCard key={post.id} post={post} />
        ))}
      </ScrollView>
    </Screen>
  );
};

export default observer(FeedScheduledScreen);
