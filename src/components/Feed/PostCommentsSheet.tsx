import { PostComments } from "@components/Feed/PostComments";
import { BottomSheet } from "@components/Keyboard/BottomSheet";
import { useModalSheetMaxHeight } from "@utils/modalSheet";

interface Props {
  open: boolean;
  onClose: () => void;
  post: Parameters<typeof PostComments>[0]["post"];
}

const COMMENTS_SHEET_HEIGHT_RATIO = 0.9;

export function PostCommentsSheet({ open, onClose, post }: Props) {
  const sheetHeight = useModalSheetMaxHeight(COMMENTS_SHEET_HEIGHT_RATIO);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Comments"
      height={sheetHeight}
    >
      <PostComments post={post} />
    </BottomSheet>
  );
}
