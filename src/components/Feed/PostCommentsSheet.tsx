import { PostComments } from "@components/Feed/PostComments";
import { KeyboardAwareView } from "@components/Keyboard/KeyboardAwareView";
import { Paper } from "@components/Paper";
import {
  MODAL_SHEET_WRAPPER_STYLE,
  useModalSheetMaxHeight,
} from "@utils/modalSheet";
import { Modal, Typography } from "@mutualzz/ui-native";
import { View } from "react-native";

interface Props {
  open: boolean;
  onClose: () => void;
  post: Parameters<typeof PostComments>[0]["post"];
}

const COMMENTS_SHEET_HEIGHT_RATIO = 0.9;

export function PostCommentsSheet({ open, onClose, post }: Props) {
  const sheetHeight = useModalSheetMaxHeight(COMMENTS_SHEET_HEIGHT_RATIO);

  return (
    <Modal
      open={open}
      onClose={onClose}
      layout="fullscreen"
      showCloseButton={false}
      style={{
        justifyContent: "flex-end",
        alignItems: "stretch",
        backgroundColor: "transparent",
        paddingVertical: 0,
      }}
    >
      <View pointerEvents="box-none" style={MODAL_SHEET_WRAPPER_STYLE}>
        <KeyboardAwareView style={{ justifyContent: "flex-end", width: "100%" }}>
          <Paper
            style={{
              height: sheetHeight,
              maxHeight: sheetHeight,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              gap: 12,
              flexDirection: "column",
            }}
            elevation={4}
          >
            <Typography level="body-lg" weight={700}>
              Comments
            </Typography>
            <View style={{ flex: 1, minHeight: 0 }}>
              <PostComments post={post} />
            </View>
          </Paper>
        </KeyboardAwareView>
      </View>
    </Modal>
  );
}
