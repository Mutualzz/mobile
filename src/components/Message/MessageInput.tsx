import { ExpressionPickerSheet } from "@components/Expression/ExpressionPickerSheet";
import { IconButton } from "@components/IconButton";
import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { Paper } from "@components/Paper";
import {
  CheckIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  SmileyIcon,
  XIcon,
} from "phosphor-react-native";
import { useAppStore } from "@hooks/useStores";
import { ChannelType, MessageType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { Message } from "@stores/objects/Message";
import type { Expression } from "@stores/objects/Expression";
import type { GifResult } from "@utils/gifs";
import { resolveGifSendUrl } from "@utils/gifs";
import { formatCustomEmojiMarkdown } from "@utils/markdown/composerQueries";
import { replaceRange } from "@utils/markdown/textUtils";
import type { Selection } from "@utils/markdown/types";
import type { PickerEmoji, SkinTone } from "@utils/emojis/emojiPickerData";
import { unifiedToEmoji } from "@utils/emojis/unified";
import Snowflake from "@utils/Snowflake";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MAX_STICKERS = 3;

interface Props {
  channel: Channel;
}

export const MessageInput = observer(({ channel }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState("");
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 });
  const [stickers, setStickers] = useState<Expression[]>([]);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const typingCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editingMessage =
    channel.messages.all.find((message) => message.editing) ?? null;

  const isDM =
    channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM;
  const isGroupDM = channel.type === ChannelType.GroupDM;

  const relationship = isDM
    ? app.relationships.getForMe(channel.dmRecipient?.id ?? "")
    : null;

  const meId = app.account?.id;
  const iBlockedThem =
    !!relationship?.isBlocked && relationship.userId === meId;

  const space =
    app.spaces.get(channel.spaceId ?? "") ?? app.spaces.active ?? null;

  const denySendingMessages = isDM
    ? !!channel.dmRecipientsList.find(
        (recipient) => recipient.flags.has("System") || iBlockedThem,
      )
    : !space?.members.me?.canSendMessages(channel);

  const showExpressionPicker = !editingMessage && !denySendingMessages;

  useEffect(() => {
    if (!editingMessage) return;

    setContent(editingMessage.content ?? "");
    setSelection({ start: 0, end: 0 });
    setStickers([]);
  }, [editingMessage?.id, editingMessage?.editing]);

  useEffect(() => {
    return () => {
      if (typingCooldownRef.current) {
        clearTimeout(typingCooldownRef.current);
      }
    };
  }, []);

  const triggerTyping = useCallback(() => {
    if (editingMessage || denySendingMessages) return;

    if (!typingCooldownRef.current) {
      void app.rest.post(`/channels/${channel.id}/typing`).catch(() => {});
    }

    if (typingCooldownRef.current) {
      clearTimeout(typingCooldownRef.current);
    }

    typingCooldownRef.current = setTimeout(() => {
      typingCooldownRef.current = null;
    }, 8000);
  }, [app.rest, channel.id, editingMessage, denySendingMessages]);

  const cancelEditing = useCallback(() => {
    editingMessage?.setEditing(false);
    setContent("");
    setSelection({ start: 0, end: 0 });
    setStickers([]);
  }, [editingMessage]);

  const insertIntoComposer = useCallback(
    (insert: string) => {
      const rep = replaceRange(content, selection.start, selection.end, insert);
      const caret = selection.start + insert.length;
      setContent(rep.text);
      setSelection({ start: caret, end: caret });
      triggerTyping();
    },
    [content, selection.end, selection.start, triggerTyping],
  );

  const canSubmit = useCallback(() => {
    if (editingMessage) {
      return (
        !!content.trim() &&
        content.trim() !== (editingMessage.content ?? "").trim()
      );
    }

    const hasText =
      !!content && !!content.trim() && !!content.replace(/\r?\n|\r/g, "");

    return hasText || stickers.length > 0;
  }, [content, editingMessage, stickers.length]);

  const saveEdit = useCallback(
    async (message: Message) => {
      if (!canSubmit() || saving) return;

      setSaving(true);
      try {
        await message.edit(content);
        setContent("");
        setSelection({ start: 0, end: 0 });
        setStickers([]);
      } catch {
        // keep editing state so the user can retry
      } finally {
        setSaving(false);
      }
    },
    [canSubmit, content, saving],
  );

  const sendContent = useCallback(
    async (text: string, stickerList: Expression[] = []) => {
      const trimmed = text.trim();
      if (!trimmed && stickerList.length === 0) return;

      const nonce = Snowflake.generate();
      const author = app.account!.raw;
      const stickerIds = stickerList.map((sticker) => sticker.id);
      const msg = app.queue.add({
        id: nonce,
        content: text,
        author,
        authorId: author.id,
        channelId: channel.id,
        spaceId: channel.space?.id ?? null,
        createdAt: new Date().toISOString(),
        type: MessageType.Default,
        expressionIds: stickerIds,
        expressions: stickerList.map((sticker) => sticker.toJSON()),
      });

      const body = {
        content: text,
        nonce,
        ...(stickerIds.length > 0 ? { expressionIds: stickerIds } : {}),
      };

      try {
        setContent("");
        setSelection({ start: 0, end: 0 });
        setStickers([]);

        await channel.sendMessage(body, msg);
      } catch (e) {
        const error =
          e instanceof Error
            ? e.message
            : typeof e === "string"
              ? e
              : "Unknown error";

        msg.fail(error);
      }
    },
    [app.account, app.queue, channel],
  );

  const sendMessage = useCallback(async () => {
    if (editingMessage) {
      await saveEdit(editingMessage);
      return;
    }

    if (!canSubmit()) return;
    await sendContent(content, stickers);
  }, [canSubmit, content, editingMessage, saveEdit, sendContent, stickers]);

  const handleSelectEmoji = useCallback(
    (emoji: PickerEmoji, skinTone: SkinTone) => {
      const unified =
        (skinTone && emoji.skinVariations?.[skinTone]?.unified) ||
        emoji.unified;
      insertIntoComposer(unifiedToEmoji(unified));
    },
    [insertIntoComposer],
  );

  const handleSelectCustomEmoji = useCallback(
    (expression: Expression) => {
      insertIntoComposer(formatCustomEmojiMarkdown(expression));
    },
    [insertIntoComposer],
  );

  const handleSelectGif = useCallback(
    (gif: GifResult) => {
      if (denySendingMessages || editingMessage) return;
      void sendContent(resolveGifSendUrl(gif));
    },
    [denySendingMessages, editingMessage, sendContent],
  );

  const handleSelectSticker = useCallback((sticker: Expression) => {
    setStickers((prev) => {
      if (prev.some((entry) => entry.id === sticker.id)) return prev;
      if (prev.length >= MAX_STICKERS) return prev;
      return [...prev, sticker];
    });
  }, []);

  const handleRemoveSticker = useCallback((stickerId: string) => {
    setStickers((prev) => prev.filter((sticker) => sticker.id !== stickerId));
  }, []);

  const placeholder = (() => {
    if (denySendingMessages) {
      return isDM
        ? "You cannot message this person, because you have them blocked"
        : "You are not allowed to send messages in this channel.";
    }

    if (editingMessage) return "Edit message";

    if (isDM) {
      return `Message ${
        isGroupDM
          ? (channel.name ?? "the group")
          : (channel.dmRecipient?.displayName ?? "in this conversation")
      }`;
    }

    return `Message #${channel.name}`;
  })();

  const handleContentChange = useCallback(
    (next: string) => {
      setContent(next);
      triggerTyping();
    },
    [triggerTyping],
  );

  return (
    <Paper
      elevation={app.settings?.preferEmbossed ? 4 : 0}
      style={{
        flexShrink: 0,
        flexGrow: 0,
        paddingHorizontal: 12,
        paddingBottom: insets.bottom + 12,
        paddingTop: editingMessage ? 0 : 12,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
      }}
    >
      {editingMessage && (
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingTop: 10,
            paddingBottom: 10,
            marginBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: `${theme.colors.neutral}33`,
          }}
        >
          <PencilSimpleIcon
            size={16}
            color={theme.colors.primary}
            weight="fill"
          />
          <Typography
            level="body-sm"
            style={{ flex: 1, color: theme.colors.primary }}
          >
            Editing message
          </Typography>
          <IconButton
            padding={6}
            color="neutral"
            onPress={cancelEditing}
            accessibilityLabel="Cancel edit"
          >
            <XIcon size={20} />
          </IconButton>
        </Box>
      )}

      {stickers.length > 0 && (
        <Box
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            paddingBottom: 10,
            marginBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: `${theme.colors.neutral}33`,
          }}
        >
          {stickers.map((sticker) => (
            <Box
              key={sticker.id}
              style={{
                position: "relative",
                width: 72,
                height: 72,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={{ uri: sticker.url }}
                style={{ width: 64, height: 64 }}
                resizeMode="contain"
              />
              <IconButton
                padding={4}
                color="neutral"
                onPress={() => handleRemoveSticker(sticker.id)}
                accessibilityLabel="Remove sticker"
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  backgroundColor: `${theme.colors.neutral}88`,
                  borderRadius: 999,
                }}
              >
                <XIcon size={12} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <MarkdownInput
          value={content}
          onChange={handleContentChange}
          selection={selection}
          onChangeSelection={setSelection}
          channelId={channel.id}
          enableEmoticons
          placeholder={placeholder}
          editable={!denySendingMessages}
          elevation={app.settings?.preferEmbossed ? 5 : 0}
          paddingLeft={14}
          paddingRight={showExpressionPicker ? 40 : 14}
          paddingTop={12}
          paddingBottom={12}
          endAdornment={
            showExpressionPicker ? (
              <IconButton
                padding={4}
                color="neutral"
                onPress={() => setPickerOpen(true)}
                accessibilityLabel="Open expression picker"
              >
                <SmileyIcon size={22} weight="fill" />
              </IconButton>
            ) : undefined
          }
          style={{
            minHeight: 44,
            maxHeight: 160,
            flex: 1,
            marginRight: 8,
            borderRadius: 999,
          }}
        />
        <IconButton
          padding={8}
          style={{
            borderRadius: 999,
          }}
          color="primary"
          onPress={() => void sendMessage()}
          disabled={!canSubmit() || saving || denySendingMessages}
        >
          {editingMessage ? (
            <CheckIcon size={20} weight="bold" />
          ) : (
            <PaperPlaneTiltIcon size={20} weight="fill" />
          )}
        </IconButton>
      </Box>

      <ExpressionPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        channel={channel}
        showStickers={showExpressionPicker}
        onSelectEmoji={handleSelectEmoji}
        onSelectCustomEmoji={handleSelectCustomEmoji}
        onSelectGif={handleSelectGif}
        onSelectSticker={handleSelectSticker}
      />
    </Paper>
  );
});
