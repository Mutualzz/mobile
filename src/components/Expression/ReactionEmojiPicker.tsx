import { EmojiPickerContent } from "@components/Expression/EmojiPickerContent";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import type { PickerEmoji, SkinTone } from "@utils/emojis/emojiPickerData";
import { XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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

// A thin bottom-sheet shell around EmojiPickerContent — the same picker used
// by the main message composer's emoji tab (ExpressionPickerSheet) — so
// every "pick an emoji" surface in the app (reactions, custom status, the
// composer) shares one implementation instead of drifting apart.
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
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
          onPress={onClose}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                  <Typography level="body-md" weight="bold" style={{ flex: 1 }}>
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
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    );
  },
);
