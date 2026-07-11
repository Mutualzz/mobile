import { Button } from "@components/Button";
import { ReactionEmojiPicker } from "@components/Expression/ReactionEmojiPicker";
import { Paper } from "@components/Paper";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import {
  ArrowBendUpLeftIcon,
  CopyIcon,
  FlagIcon,
  PencilSimpleIcon,
  SmileyIcon,
  TrashIcon,
} from "phosphor-react-native";
import { useRecentEmojis } from "@hooks/useRecentEmojis";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { UnicodeEmoji } from "@components/emojis/UnicodeEmoji";
import { Box, ButtonGroup, Divider, Modal, useTheme } from "@mutualzz/ui-native";
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
import {
  useScaledSquareSize,
  useScaledTouchTarget,
} from "@utils/accessibilityLayout";
import * as Clipboard from "expo-clipboard";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, View } from "react-native";
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
  accessibilityLabel,
}: {
  item: QuickReactionItem;
  onPress: () => void;
  backgroundColor: string;
  accessibilityLabel: string;
}) => {
  const minHeight = useScaledTouchTarget(48);
  const iconSize = useScaledSquareSize(26);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        flex: 1,
        minWidth: 0,
        minHeight,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        backgroundColor,
      }}
    >
      {item.kind === "custom" ? (
        <Image
          source={{ uri: item.url }}
          style={{ width: iconSize, height: iconSize }}
          resizeMode="contain"
        />
      ) : (
        <UnicodeEmoji value={item.unicode} size={iconSize} />
      )}
    </Pressable>
  );
};

export const MessageActionSheet = observer(
  ({ message, visible, onClose }: Props) => {
    const app = useAppStore();
    const { t } = useTranslation("chat");
    const { t: tCommon } = useTranslation("common");
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const minHeight = useScaledTouchTarget(48);
    const { recents, addRecentStandard, addRecentCustom } = useRecentEmojis();
    const quickItems = getQuickReactionItems(app, recents, 3);
    const [pickerOpen, setPickerOpen] = useState(false);
    const { openModal } = useModal();

    useEffect(() => {
      if (!visible) setPickerOpen(false);
    }, [visible]);

    const me = message.space?.members.me;
    const canEdit = message.author?.id === app.account?.id;
    const canDelete = canEdit || !!me?.hasPermission("ManageMessages");
    const canCopy = !!message.content?.trim();
    const canReply = true;
    const canReport = message.author?.id !== app.account?.id;
    const hasActions = canReply || canCopy || canEdit || canDelete || canReport;

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

    const handleReply = () => {
      app.setReplyingTo(message);
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

    const handleReport = () => {
      onClose();
      openModal(
        `report-message-${message.id}`,
        <ReportContentSheet
          targetType="message"
          targetId={message.id}
          contentLabel={t("report.thisMessage")}
          modalId={`report-message-${message.id}`}
        />,
      );
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
          open={visible && !pickerOpen}
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
              <Box
                style={{
                  marginHorizontal: 12,
                  marginBottom: insets.bottom + 12,
                  gap: 8,
                }}
              >
                <Paper
                  elevation={app.settings?.preferEmbossed ? 4 : 2}
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
                          accessibilityLabel={t("actions.reactWith", {
                            emoji: item.title,
                          })}
                          onPress={() => handleQuickReaction(item)}
                        />
                      ))}
                      <Pressable
                        onPress={() => setPickerOpen(true)}
                        accessibilityRole="button"
                        accessibilityLabel={t("composer.openEmojiPicker")}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          minHeight,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 8,
                          backgroundColor: `${theme.colors.neutral}22`,
                        }}
                      >
                        <SmileyIcon
                          size={24}
                          color={theme.typography.colors.primary}
                        />
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
                      fullWidth
                      horizontalAlign="left"
                      spacing={0.5}
                    >
                      {canReply && (
                        <Button
                          fullWidth
                          padding={12}
                          startDecorator={
                            <ArrowBendUpLeftIcon size={20} weight="fill" />
                          }
                          onPress={handleReply}
                        >
                          {t("actions.reply")}
                        </Button>
                      )}
                      {canCopy && (
                        <Button
                          fullWidth
                          padding={12}
                          startDecorator={<CopyIcon size={20} />}
                          onPress={() => void handleCopy()}
                        >
                          {t("actions.copyText")}
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
                          {t("actions.editMessage")}
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
                          {t("actions.deleteMessage")}
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
                          {t("actions.reportMessage")}
                        </Button>
                      )}
                    </ButtonGroup>
                  )}
                </Paper>

                <Paper
                  elevation={app.settings?.preferEmbossed ? 4 : 2}
                  style={{
                    borderRadius: 16,
                  }}
                >
                  <Button
                    fullWidth
                    variant="soft"
                    padding={14}
                    onPress={onClose}
                  >
                    {tCommon("cancel")}
                  </Button>
                </Paper>
              </Box>
            </View>
          </View>
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
