import { Button } from "@components/Button";
import { ReactionEmojiPicker } from "@components/Expression/ReactionEmojiPicker";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { ArrowBendUpLeftIcon, CopyIcon, FlagIcon, PencilSimpleIcon, PushPinIcon, PushPinSlashIcon, SmileyIcon, TrashIcon } from "phosphor-react-native";
import { useRecentEmojis } from "@hooks/useRecentEmojis";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { UnicodeEmoji } from "@components/emojis/UnicodeEmoji";
import { Box, ButtonGroup, Divider, Sheet, useTheme } from "@mutualzz/ui-native";
import type { Expression } from "@stores/objects/Expression";
import type { Message } from "@stores/objects/Message";
import {
  getQuickReactionItems,
  type QuickReactionItem } from "@utils/quickReactionEmojis";
import type { SkinTone } from "@utils/emojis/emojiPickerData";
import type { PickerEmoji } from "@utils/emojis/emojiPickerData";
import {
  expressionToReactionEmoji,
  pickerEmojiToReactionEmoji,
  isChannelPinnedMessage,
} from "@mutualzz/client";
import {
  useScaledSquareSize,
  useScaledTouchTarget } from "@utils/accessibilityLayout";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, View } from "react-native";

interface Props {
  message: Message;
  visible: boolean;
  onClose: () => void;
}

const QuickReactionButton = ({
  item,
  onPress,
  backgroundColor,
  accessibilityLabel}: {
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
        backgroundColor}}
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
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const minHeight = useScaledTouchTarget(48);
    const { recents, addRecentStandard, addRecentCustom } = useRecentEmojis();
    const quickItems = getQuickReactionItems(app, recents, 3);
    const [pickerOpen, setPickerOpen] = useState(false);
    const { openSheet } = useSheet();

    useEffect(() => {
      if (!visible) setPickerOpen(false);
    }, [visible]);

    const me = message.space?.members.me;
    const canEdit = message.author?.id === app.account?.id;
    const canDelete =
      canEdit || !!me?.hasPermission("ManageMessages", message.channel);
    const canCopy = !!message.content?.trim();
    const canReply = true;
    const canReport = message.author?.id !== app.account?.id;
    const canPin =
      !message.space ||
      !!me?.hasPermission("PinMessages", message.channel);
    const canReact = !message.space
      ? true
      : !!me?.hasPermission("AddReactions", message.channel);
    const hasActions = canReply || canCopy || canEdit || canDelete || canReport || canPin;
    const isPinnedNotice = isChannelPinnedMessage(message);

    const handlePin = async () => {
      onClose();
      await app.rest.put(
        `channels/${message.channelId}/messages/${message.id}/pin`,
        {},
      );
      message.pinned = true;
      await queryClient.invalidateQueries({
        queryKey: ["channel-pins", message.channelId],
      });
    };

    const handleUnpin = async () => {
      onClose();
      await app.rest.delete(
        `channels/${message.channelId}/messages/${message.id}/pin`,
      );
      message.pinned = false;
      await queryClient.invalidateQueries({
        queryKey: ["channel-pins", message.channelId],
      });
    };

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
      try {
        await Clipboard.setStringAsync(message.content);
      } catch {
    // ignore
}
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
      openSheet(
        `report-message-${message.id}`,
        <ReportContentSheet
          targetType="message"
          targetId={message.id}
          contentLabel={t("report.thisMessage")}
          sheetId={`report-message-${message.id}`}
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
        <Sheet
          open={visible && !pickerOpen}
          onClose={onClose}
          showCloseButton={false}
          enableDynamicSizing
        >
          <View style={{ width: "100%" }}>
            <View onStartShouldSetResponder={() => true}>
              <Box
              style={{
                width: "100%",
                padding: 16,
                gap: 8}}
            >
                <Box style={{ gap: 12 }}>
                  {canReact && (
                  <Box
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      width: "100%"}}
                  >
                    {quickItems.map((item) => (
                      <QuickReactionButton
                        key={item.key}
                        item={item}
                        backgroundColor={`${theme.colors.neutral}22`}
                        accessibilityLabel={t("actions.reactWith", {
                          emoji: item.title})}
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
                        backgroundColor: `${theme.colors.neutral}22`}}
                    >
                      <SmileyIcon
                        size={24}
                        color={theme.typography.colors.primary}
                      />
                    </Pressable>
                  </Box>
                  )}

                  {canReact && hasActions && <Divider lineColor="muted" />}

                  {hasActions && (
                    <ButtonGroup
                      orientation="vertical"
                      variant="plain"
                      fullWidth
                      horizontalAlign="left"
                      spacing={0.5}
                    >
                      {!isPinnedNotice && canReply && (
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
                      {!isPinnedNotice && canCopy && (
                        <Button
                          fullWidth
                          padding={12}
                          startDecorator={<CopyIcon size={20} />}
                          onPress={() => void handleCopy()}
                        >
                          {t("actions.copyText")}
                        </Button>
                      )}
                      {!isPinnedNotice && canEdit && (
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
                      {!isPinnedNotice && canPin && (
                        <Button
                          fullWidth
                          padding={12}
                          startDecorator={
                            message.pinned ? (
                              <PushPinSlashIcon size={20} weight="fill" />
                            ) : (
                              <PushPinIcon size={20} weight="fill" />
                            )
                          }
                          onPress={() => void (message.pinned ? handleUnpin() : handlePin())}
                        >
                          {message.pinned
                            ? t("actions.unpinMessage")
                            : t("actions.pinMessage")}
                        </Button>
                      )}
                      {!isPinnedNotice && canReport && (
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
                </Box>
              </Box>
            </View>
          </View>
        </Sheet>

        <ReactionEmojiPicker
          visible={canReact && pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelectEmoji={handlePickerEmoji}
          onSelectCustomEmoji={handlePickerCustom}
        />
      </>
    );
  },
);
