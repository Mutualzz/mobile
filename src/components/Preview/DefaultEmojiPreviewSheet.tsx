import { ExpressionPreviewSheetLayout } from "@components/Preview/ExpressionPreviewSheetLayout";
import { Twemoji } from "@components/emojis/Twemoji";
import { Box, Typography } from "@mutualzz/ui-native";

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
              This is a default emoji. You can use it anywhere on Mutualzz
            </Typography>
          </Box>
        </Box>
    </ExpressionPreviewSheetLayout>
  );
};
