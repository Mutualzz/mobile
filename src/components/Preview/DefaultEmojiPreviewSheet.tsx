import { ExpressionPreviewSheetLayout } from "@components/Preview/ExpressionPreviewSheetLayout";
import { Twemoji } from "@components/emojis/Twemoji";
import { Box, Typography } from "@mutualzz/ui-native";
import { useTranslation } from "react-i18next";

interface Props {
  name: string;
  unicode: string;
  onClose: () => void;
}

export const DefaultEmojiPreviewSheet = ({
  name,
  unicode,
  onClose,
}: Props) => {
  const { t } = useTranslation("chat");
  return (
    <ExpressionPreviewSheetLayout onClose={onClose}>
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Twemoji value={unicode} size={48} />
          <Box style={{ flex: 1, gap: 4 }}>
            <Typography level="body-sm" textColor="accent">
              :{name}:
            </Typography>
            <Typography level="body-xs" textColor="muted">
              {t("expressionPreview.defaultEmoji")}
            </Typography>
          </Box>
        </Box>
    </ExpressionPreviewSheetLayout>
  );
};
