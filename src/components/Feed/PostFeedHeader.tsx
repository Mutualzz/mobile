import { IconButton } from "@components/IconButton";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { Time } from "@components/Time/Time";
import { UserAvatar } from "@components/User/UserAvatar";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import { FlagIcon, TrashIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

export const PostFeedHeader = observer(({ post }: { post: Post }) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { openSheet } = useSheet();
  const { t } = useTranslation("chat");

  return (
    <Box
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          flex: 1,
          minWidth: 0,
        }}
      >
        <UserAvatar user={post.author} size="md" badge />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Typography level="body-md" weight={700} truncate="single">
            {post.author?.displayName ?? t("unknownUser")}
          </Typography>
          <Time
            value={post.createdAt}
            defaultMode="calendar"
            toggleOnPress={false}
            typographyProps={{ level: "body-xs", textColor: "muted" }}
          />
        </Box>
      </Box>

      {post.authorId === app.account?.id ? (
        <IconButton
          variant="plain"
          color="danger"
          padding={6}
          onPress={() => void post.delete()}
          accessibilityLabel={t("feed.actions.deletePost")}
        >
          <TrashIcon size={18} color={theme.colors.danger} />
        </IconButton>
      ) : (
        <IconButton
          variant="plain"
          color="danger"
          padding={6}
          onPress={() =>
            openSheet(
              `report-post-${post.id}`,
              <ReportContentSheet
                targetType="post"
                targetId={post.id}
                contentLabel={t("feed.report.thisPost")}
                sheetId={`report-post-${post.id}`}
              />,
            )
          }
          accessibilityLabel={t("feed.actions.reportPost")}
        >
          <FlagIcon size={18} color={theme.colors.danger} />
        </IconButton>
      )}
    </Box>
  );
});
