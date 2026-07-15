import { PostComments } from "@components/Feed/PostComments";
import { Box, Sheet, Typography } from "@mutualzz/ui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  open: boolean;
  onClose: () => void;
  post: Parameters<typeof PostComments>[0]["post"];
}

export function PostCommentsSheet({ open, onClose, post }: Props) {
  const { t } = useTranslation("chat");

  return (
    <Sheet
      open={open}
      onClose={onClose}
      showCloseButton={false}
      snapPoints={["90%"]}
      enableDynamicSizing={false}
    >
      <View
        style={{
          flex: 1,
          width: "100%",
          minHeight: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          gap: 12}}
      >
        <Typography level="body-lg" weight={700}>
          {t("feed.comments.title")}
        </Typography>
        <Box style={{ flex: 1, minHeight: 0 }}>
          <PostComments post={post} />
        </Box>
      </View>
    </Sheet>
  );
}
