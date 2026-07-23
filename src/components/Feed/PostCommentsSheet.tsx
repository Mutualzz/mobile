import { PostComments } from "@components/Feed/PostComments";
import { Box, Sheet, Typography, useTheme } from "@mutualzz/ui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  open: boolean;
  onClose: () => void;
  post: Parameters<typeof PostComments>[0]["post"];
}

export function PostCommentsSheet({ open, onClose, post }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation("chat");

  return (
    <Sheet
      open={open}
      onClose={onClose}
      showCloseButton={false}
      snapPoints={["75%"]}
      enableDynamicSizing={false}
    >
      <View
        style={{
          flex: 1,
          width: "100%",
          minHeight: 0
        }}
      >
        <Box
          style={{
            alignItems: "center",
            paddingTop: 8,
            paddingBottom: 12,
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: `${theme.typography.colors.muted}33`
          }}
        >
          <Box
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              backgroundColor: theme.typography.colors.muted
            }}
          />

          <Box
            style={{
              width: "100%",
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <Typography level="body-lg" weight={700}>
              {t("feed.comments.title")}
              {post.commentCount > 0 ? ` · ${post.commentCount}` : ""}
            </Typography>
          </Box>
        </Box>

        <Box style={{ flex: 1, minHeight: 0, paddingHorizontal: 12 }}>
          <PostComments post={post} />
        </Box>
      </View>
    </Sheet>
  );
}
