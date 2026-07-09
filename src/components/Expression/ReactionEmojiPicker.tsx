import { EmojiPickerContent } from "@components/Expression/EmojiPickerContent";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, Modal, Typography } from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import type { PickerEmoji, SkinTone } from "@utils/emojis/emojiPickerData";
import { XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import {
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  onSelectEmoji: (emoji: PickerEmoji, skinTone: SkinTone) => void;
  onSelectCustomEmoji: (expression: Expression) => void;
}

export const ReactionEmojiPicker = observer(
  ({
    visible,
    onClose,
    title = "Add Reaction",
    onSelectEmoji,
    onSelectCustomEmoji,
  }: Props) => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();

    const handleSelectEmoji = (emoji: PickerEmoji, tone: SkinTone) => {
      onSelectEmoji(emoji, tone);
      onClose();
    };

    const handleSelectCustomEmoji = (expression: Expression) => {
      onSelectCustomEmoji(expression);
      onClose();
    };

    return (
      <Modal
        open={visible}
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
        <View
          pointerEvents="box-none"
          style={{
            flex: 1,
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <View onStartShouldSetResponder={() => true}>
            <Paper
                elevation={app.settings?.preferEmbossed ? 4 : 2}
                style={{
                  height: height * 0.7,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  paddingTop: 12,
                  paddingBottom: insets.bottom + 12,
                }}
              >
                <Box
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingBottom: 8,
                    gap: 8,
                  }}
                >
                  <Typography
                    level="body-md"
                    weight="bold"
                    truncate="single"
                    style={{ flex: 1 }}
                  >
                    {title}
                  </Typography>
                  <IconButton padding={6} color="neutral" onPress={onClose}>
                    <XIcon size={20} />
                  </IconButton>
                </Box>

                <EmojiPickerContent
                  onSelectEmoji={handleSelectEmoji}
                  onSelectCustomEmoji={handleSelectCustomEmoji}
                />
              </Paper>
            </View>
        </View>
      </Modal>
    );
  },
);
