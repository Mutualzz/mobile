import { Button } from "@components/Button";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { Box, ButtonGroup, Sheet } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import type { PostComment } from "@stores/objects/PostComment";
import { getCommentPlainText } from "@utils/postComments";
import * as Clipboard from "expo-clipboard";
import {
  ArrowBendUpLeftIcon,
  CopyIcon,
  FlagIcon,
  TrashIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  post: Post;
  comment: PostComment;
  visible: boolean;
  onClose: () => void;
  onReply: (comment: PostComment) => void;
}

export const CommentActionSheet = observer(
  ({ post, comment, visible, onClose, onReply }: Props) => {
    const app = useAppStore();
    const { t } = useTranslation("chat");
    const { openSheet } = useSheet();

    const canDelete =
      comment.authorId === app.account?.id || post.authorId === app.account?.id;
    const canReport = comment.authorId !== app.account?.id;
    const plainText = getCommentPlainText(comment);

    const handleReply = () => {
      onReply(comment);
      onClose();
    };

    const handleCopy = async () => {
      if (!plainText) return;
      try {
        await Clipboard.setStringAsync(plainText);
      } catch {
    // ignore
}
      onClose();
    };

    const handleDelete = async () => {
      onClose();
      await comment.delete();
    };

    const handleReport = () => {
      onClose();
      openSheet(
        `report-comment-${comment.id}`,
        <ReportContentSheet
          targetType="comment"
          targetId={comment.id}
          contentLabel={t("feed.report.thisComment")}
          sheetId={`report-comment-${comment.id}`}
        />,
      );
    };

    return (
      <Sheet open={visible} onClose={onClose} showCloseButton={false} enableDynamicSizing>
        <View style={{ width: "100%" }}>
          <View onStartShouldSetResponder={() => true}>
            <Box style={{ width: "100%", padding: 16 }}>
              <ButtonGroup
                orientation="vertical"
                variant="plain"
                fullWidth
                horizontalAlign="left"
                spacing={0.5}
              >
                <Button
                  fullWidth
                  padding={12}
                  startDecorator={
                    <ArrowBendUpLeftIcon size={20} weight="fill" />
                  }
                  onPress={handleReply}
                >
                  {t("feed.comments.reply")}
                </Button>

                {!!plainText && (
                  <Button
                    fullWidth
                    padding={12}
                    startDecorator={<CopyIcon size={20} />}
                    onPress={() => void handleCopy()}
                  >
                    {t("actions.copyText")}
                  </Button>
                )}

                {canDelete && (
                  <Button
                    fullWidth
                    padding={12}
                    color="danger"
                    startDecorator={<TrashIcon size={20} weight="fill" />}
                    onPress={() => void handleDelete()}
                  >
                    {t("feed.actions.deleteComment")}
                  </Button>
                )}

                {canReport && (
                  <Button
                    fullWidth
                    padding={12}
                    color="danger"
                    startDecorator={<FlagIcon size={20} weight="fill" />}
                    onPress={handleReport}
                  >
                    {t("feed.actions.reportComment")}
                  </Button>
                )}
              </ButtonGroup>
            </Box>
          </View>
        </View>
      </Sheet>
    );
  },
);
