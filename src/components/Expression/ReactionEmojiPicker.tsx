import { EmojiPickerContent } from "@components/Expression/EmojiPickerContent";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, Modal, Typography } from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import type { PickerEmoji, SkinTone } from "@utils/emojis/emojiPickerData";
import { MODAL_SHEET_WRAPPER_STYLE } from "@utils/modalSheet";
import { XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible?: boolean;
  onClose: () => void;
  title?: string;
  onSelectEmoji: (emoji: PickerEmoji, skinTone: SkinTone) => void;
  onSelectCustomEmoji: (expression: Expression) => void;
  /** Panel only — use with ModalRoot to avoid nested RN Modals. */
  embedded?: boolean;
}

export const ReactionEmojiPicker = observer(
  ({
    visible = true,
    onClose,
    title,
    onSelectEmoji,
    onSelectCustomEmoji,
    embedded = false,
  }: Props) => {
    const { t } = useTranslation("chat");
    const app = useAppStore();
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const resolvedTitle = title ?? t("actions.addReaction");

    const handleSelectEmoji = (emoji: PickerEmoji, tone: SkinTone) => {
      onSelectEmoji(emoji, tone);
      onClose();
    };

    const handleSelectCustomEmoji = (expression: Expression) => {
      onSelectCustomEmoji(expression);
      onClose();
    };

    const panel = (
      <View pointerEvents="box-none" style={MODAL_SHEET_WRAPPER_STYLE}>
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
                {resolvedTitle}
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
    );

    if (embedded) return panel;

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
        {panel}
      </Modal>
    );
  },
);
