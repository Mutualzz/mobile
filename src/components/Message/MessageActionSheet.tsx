import { ReactionEmojiPicker } from "@components/Expression/ReactionEmojiPicker";
import { Paper } from "@components/Paper";
import {
    CopyIcon,
    PencilSimpleIcon,
    SmileyIcon,
    TrashIcon,
} from "phosphor-react-native";
import { useRecentEmojis } from "@hooks/useRecentEmojis";
import { useAppStore } from "@hooks/useStores";
import { UnicodeEmoji } from "@components/emojis/UnicodeEmoji";
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  useTheme,
} from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import type { Message } from "@stores/objects/Message";
import {
  getQuickReactionItems,
  type QuickReactionItem,
} from "@utils/quickReactionEmojis";
import type { SkinTone } from "@utils/emojis/emojiPickerData";
import type { PickerEmoji } from "@utils/emojis/emojiPickerData";
import {
  expressionToReactionEmoji,
  pickerEmojiToReactionEmoji,
} from "@utils/reactions";
import * as Clipboard from "expo-clipboard";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Image, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  message: Message;
  visible: boolean;
  onClose: () => void;
}

const QuickReactionButton = ({
  item,
  onPress,
  backgroundColor,
}: {
  item: QuickReactionItem;
  onPress: () => void;
  backgroundColor: string;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      flex: 1,
      minWidth: 0,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      backgroundColor,
    }}
  >
    {item.kind === "custom" ? (
      <Image
        source={{ uri: item.url }}
        style={{ width: 26, height: 26 }}
        resizeMode="contain"
      />
    ) : (
      <UnicodeEmoji value={item.unicode} size={26} />
    )}
  </Pressable>
);

export const MessageActionSheet = observer(
  ({ message, visible, onClose }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { recents, addRecentStandard, addRecentCustom } = useRecentEmojis();
    const quickItems = getQuickReactionItems(app, recents, 3);
    const [pickerOpen, setPickerOpen] = useState(false);

    useEffect(() => {
      if (!visible) setPickerOpen(false);
    }, [visible]);

    const me = message.space?.members.me;
    const canEdit = message.author?.id === app.account?.id;
    const canDelete = canEdit || !!me?.hasPermission("ManageMessages");
    const canCopy = !!message.content?.trim();
    const hasActions = canCopy || canEdit || canDelete;

    const handleQuickReaction = (item: QuickReactionItem) => {
      if (item.kind === "standard") {
        const [unified, ...rest] = item.key.split(":");
        addRecentStandard(unified, rest.join(":") || null);
      } else {
        addRecentCustom(
          item.expression.id,
          item.expression.name,
          item.expression.url,
          item.expression.animated,
        );
      }

      void message.toggleReaction(item.toReaction());
      onClose();
    };

    const handleCopy = async () => {
      if (!message.content) return;
      await Clipboard.setStringAsync(message.content);
      onClose();
    };

    const handleEdit = () => {
      message.channel?.messages.all.forEach((msg: Message) =>
        msg.setEditing(false),
      );
      message.setEditing(true);
      onClose();
    };

    const handleDelete = async () => {
      onClose();
      await message.delete();
    };

    const handlePickerEmoji = (emoji: PickerEmoji, skinTone: SkinTone) => {
      addRecentStandard(emoji.unified, skinTone);
      void message.toggleReaction(pickerEmojiToReactionEmoji(emoji, skinTone));
      onClose();
    };

    const handlePickerCustom = (expression: Expression) => {
      addRecentCustom(
        expression.id,
        expression.name,
        expression.url,
        expression.animated,
      );
      void message.toggleReaction(expressionToReactionEmoji(expression));
      onClose();
    };

    return (
      <>
        <Modal
          visible={visible && !pickerOpen}
          transparent
          animationType="fade"
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
            <View onStartShouldSetResponder={() => true}>
              <Box
                style={{
                  marginHorizontal: 12,
                  marginBottom: insets.bottom + 12,
                  gap: 8,
                }}
              >
                <Paper
                  elevation={app.settings?.preferEmbossed ? 5 : 2}
                  style={{
                    borderRadius: 16,
                    padding: 12,
                    gap: 12,
                  }}
                >
                  {quickItems.length > 0 && (
                    <Box
                      style={{
                        flexDirection: "row",
                        gap: 8,
                        width: "100%",
                      }}
                    >
                      {quickItems.map((item) => (
                        <QuickReactionButton
                          key={item.key}
                          item={item}
                          backgroundColor={`${theme.colors.neutral}22`}
                          onPress={() => handleQuickReaction(item)}
                        />
                      ))}
                      <Pressable
                        onPress={() => setPickerOpen(true)}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          minHeight: 48,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 8,
                          backgroundColor: `${theme.colors.neutral}22`,
                        }}
                      >
                        <SmileyIcon size={24} color={theme.typography.colors.primary} />
                      </Pressable>
                    </Box>
                  )}

                  {quickItems.length > 0 && hasActions && (
                    <Divider lineColor="muted" />
                  )}

                  {hasActions && (
                    <ButtonGroup
                      orientation="vertical"
                      variant="plain"
                      color="neutral"
                      fullWidth
                      horizontalAlign="left"
                      spacing={0.5}
                    >
                      {canCopy && (
                        <Button
                          fullWidth
                          padding={12}
                          startDecorator={
                            <CopyIcon size={20} />
                          }
                          onPress={() => void handleCopy()}
                        >
                          Copy Text
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          fullWidth
                          padding={12}
                          startDecorator={
                            <PencilSimpleIcon size={20} weight="fill" />
                          }
                          onPress={handleEdit}
                        >
                          Edit Message
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          fullWidth
                          padding={12}
                          color="danger"
                          startDecorator={
                            <TrashIcon size={20} weight="fill" />
                          }
                          onPress={() => void handleDelete()}
                        >
                          Delete Message
                        </Button>
                      )}
                    </ButtonGroup>
                  )}
                </Paper>

                <Paper
                  elevation={app.settings?.preferEmbossed ? 5 : 2}
                  style={{
                    borderRadius: 16,
                  }}
                >
                  <Button
                    fullWidth
                    variant="soft"
                    color="neutral"
                    padding={14}
                    onPress={onClose}
                  >
                    Cancel
                  </Button>
                </Paper>
              </Box>
            </View>
          </Pressable>
        </Modal>

        <ReactionEmojiPicker
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelectEmoji={handlePickerEmoji}
          onSelectCustomEmoji={handlePickerCustom}
        />
      </>
    );
  },
);
