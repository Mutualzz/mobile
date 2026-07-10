import { ExpressionPickerSheet } from "@components/Expression/ExpressionPickerSheet";
import { IconButton } from "@components/IconButton";
import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { Paper } from "@components/Paper";
import {
  CheckIcon,
  PaperclipIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  SmileyIcon,
  XIcon,
} from "phosphor-react-native";
import { useAppStore } from "@hooks/useStores";
import { useComposerSafePadding } from "@hooks/useKeyboardOffset";
import {
  Box,
  scaledLayoutSize,
  Typography,
  useFontScale,
  useTheme,
} from "@mutualzz/ui-native";
import {
  useScaledComposerPanelMaxHeight,
  useScaledFeedPreviewSizes,
} from "@utils/accessibilityLayout";
import type { Channel } from "@stores/objects/Channel";
import type { Message } from "@stores/objects/Message";
import type { Expression } from "@stores/objects/Expression";
import type { GifResult } from "@utils/gifs";
import { resolveGifSendUrl } from "@utils/gifs";
import { expandCustomEmojiShortcodes } from "@utils/markdown/composerQueries";
import {
  findCustomEmojiByLabel,
  getCustomEmojiLabel,
} from "@utils/expressions";
import {
  entitiesToRawMarkdown,
  rawMarkdownToFriendly,
  shiftEntitiesForEdit,
  type MentionEntity,
} from "@utils/markdown/mentionEntities";
import { replaceRange } from "@utils/markdown/textUtils";
import type { Selection } from "@utils/markdown/types";
import type { PickerEmoji, SkinTone } from "@utils/emojis/emojiPickerData";
import { unifiedToEmoji } from "@utils/emojis/unified";
import Snowflake from "@utils/Snowflake";
import { createSystemMessage } from "@utils/index";
import { messageFlags } from "@mutualzz/bitfield";
import {
  HttpException,
  HttpStatusCode,
  type APIMessage,
  ChannelType,
  MessageType,
} from "@mutualzz/types";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";

const MAX_STICKERS = 3;
const MAX_ATTACHMENTS = 10;
const MAX_ATTACHMENT_SIZE = 100 * 1024 * 1024;

interface PickedAttachment {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

interface Props {
  channel: Channel;
}

export const MessageInput = observer(({ channel }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const fontScale = useFontScale();
  const composerMaxHeight = useScaledComposerPanelMaxHeight();
  const feedSizes = useScaledFeedPreviewSizes();
  const composerBottomPadding = useComposerSafePadding();
  const [content, setContent] = useState("");
  const [entities, setEntities] = useState<MentionEntity[]>([]);
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 });
  const [stickers, setStickers] = useState<Expression[]>([]);
  const [attachments, setAttachments] = useState<PickedAttachment[]>([]);
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
  const theyBlockedMe =
    !!relationship?.isBlocked && relationship.userId !== meId;

  const space =
    app.spaces.get(channel.spaceId ?? "") ?? app.spaces.active ?? null;

  const denySendingMessages = isDM
    ? !!channel.dmRecipientsList.find(
        (recipient) => recipient.flags.has("System") || iBlockedThem,
      )
    : !space?.members.me?.canSendMessages(channel);

  const showExpressionPicker = !editingMessage && !denySendingMessages;

  useEffect(() => {
    app.setReplyingTo(null);
  }, [app, channel.id]);

  useEffect(() => {
    if (!editingMessage) return;

    const { text, entities: parsedEntities } = rawMarkdownToFriendly(
      editingMessage.content ?? "",
      (id) => {
        const member = space?.members.get(id);
        const user = app.users.get(id);
        return member?.displayName || user?.displayName || user?.username;
      },
      (id) => space?.roles.get(id)?.name,
    );

    setContent(text);
    setEntities(parsedEntities);
    setSelection({ start: 0, end: 0 });
    setStickers([]);
  }, [editingMessage?.id, editingMessage?.editing, app.users, space]);

  const editingMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (editingMessage) {
      editingMessageIdRef.current = editingMessage.id;
      return;
    }

    const previousId = editingMessageIdRef.current;
    editingMessageIdRef.current = null;

    if (previousId && !channel.messages.get(previousId)) {
      setContent("");
      setEntities([]);
      setSelection({ start: 0, end: 0 });
      setStickers([]);
    }
  }, [editingMessage, channel.messages]);

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
      void app.rest.post(`/channels/${channel.id}/typing`);
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
    setEntities([]);
    setSelection({ start: 0, end: 0 });
    setStickers([]);
  }, [editingMessage]);

  const insertIntoComposer = useCallback(
    (insert: string) => {
      const rep = replaceRange(content, selection.start, selection.end, insert);
      const caret = selection.start + insert.length;
      setEntities((prev) => shiftEntitiesForEdit(prev, content, rep.text));
      setContent(rep.text);
      setSelection({ start: caret, end: caret });
      triggerTyping();
    },
    [content, selection.end, selection.start, triggerTyping],
  );

  const rawContent = useMemo(
    () => entitiesToRawMarkdown(content, entities),
    [content, entities],
  );

  const canSubmit = useCallback(() => {
    if (editingMessage) {
      return (
        !!rawContent.trim() &&
        rawContent.trim() !== (editingMessage.content ?? "").trim()
      );
    }

    const hasText =
      !!content && !!content.trim() && !!content.replace(/\r?\n|\r/g, "");

    return hasText || stickers.length > 0 || attachments.length > 0;
  }, [
    content,
    editingMessage,
    rawContent,
    stickers.length,
    attachments.length,
  ]);

  const pickAttachments = useCallback(async () => {
    if (denySendingMessages || editingMessage) return;
    if (attachments.length >= MAX_ATTACHMENTS) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (result.canceled) return;

    const next = result.assets
      .filter((a) => (a.fileSize ?? 0) <= MAX_ATTACHMENT_SIZE)
      .map((a) => ({
        uri: a.uri,
        type: a.mimeType ?? (a.type === "video" ? "video/mp4" : "image/jpeg"),
        name: a.fileName ?? `attachment.${a.type === "video" ? "mp4" : "jpg"}`,
        size: a.fileSize ?? undefined,
      }));

    setAttachments((prev) => [...prev, ...next].slice(0, MAX_ATTACHMENTS));
  }, [attachments.length, denySendingMessages, editingMessage]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const expandCustomEmoji = useCallback(
    (text: string) => {
      const currentMember = channel.spaceId
        ? app.spaces.get(channel.spaceId)?.members.me
        : null;

      return expandCustomEmojiShortcodes(text, (name) =>
        findCustomEmojiByLabel(
          app.expressions.all,
          name,
          meId ?? "",
          currentMember,
          channel,
        ),
      );
    },
    [app.expressions.all, app.spaces, channel, meId],
  );

  const saveEdit = useCallback(
    async (message: Message) => {
      if (!canSubmit() || saving) return;

      setSaving(true);
      try {
        await message.edit(expandCustomEmoji(rawContent));
        setContent("");
        setEntities([]);
        setSelection({ start: 0, end: 0 });
        setStickers([]);
      } catch {
        // keep editing state so the user can retry
      } finally {
        setSaving(false);
      }
    },
    [canSubmit, expandCustomEmoji, rawContent, saving],
  );

  const sendContent = useCallback(
    async (
      text: string,
      stickerList: Expression[] = [],
      fileList: PickedAttachment[] = [],
    ) => {
      const trimmed = text.trim();
      if (!trimmed && stickerList.length === 0 && fileList.length === 0) return;

      const nonce = Snowflake.generate();
      const author = app.account!.raw;
      const stickerIds = stickerList.map((sticker) => sticker.id);
      const replyingTo = app.replyingTo;
      const repliedToId = replyingTo?.id;
      const mentionReply = app.replyMention;
      const repliedToPayload: APIMessage | undefined =
        replyingTo && repliedToId
          ? {
              id: replyingTo.id,
              content: replyingTo.content,
              authorId: replyingTo.authorId,
              channelId: replyingTo.channelId!,
              spaceId: replyingTo.spaceId,
              type: replyingTo.type,
              createdAt: replyingTo.createdAt,
              author: replyingTo.author?.toJSON(),
              edited: false,
              flags: 0n,
            }
          : undefined;

      const msg = app.queue.add({
        id: nonce,
        content: text,
        author,
        authorId: author.id,
        channelId: channel.id,
        spaceId: channel.space?.id ?? null,
        createdAt: new Date().toISOString(),
        type: repliedToId ? MessageType.Reply : MessageType.Default,
        expressionIds: stickerIds,
        expressions: stickerList.map((sticker) => sticker.toJSON()),
        repliedToId,
        repliedTo: repliedToPayload,
      });

      app.setReplyingTo(null);

      const body = {
        content: text,
        nonce,
        ...(stickerIds.length > 0 ? { expressionIds: stickerIds } : {}),
        ...(repliedToId ? { repliedToId, mentionReply } : {}),
      };

      try {
        if (isDM && theyBlockedMe) {
          throw new HttpException(
            HttpStatusCode.Forbidden,
            "You cannot message this person",
          );
        }

        let result: APIMessage | undefined;
        if (fileList.length > 0) {
          const formData = new FormData();
          if (text) formData.append("content", text);
          formData.append("nonce", String(nonce));
          stickerIds.forEach((id) =>
            formData.append("expressionIds[]", String(id)),
          );
          if (repliedToId) {
            formData.append("repliedToId", repliedToId);
            formData.append("mentionReply", String(mentionReply));
          }
          fileList.forEach((file) => {
            formData.append("attachments", {
              uri: file.uri,
              type: file.type,
              name: file.name,
            } as unknown as Blob);
          });
          result = await channel.sendMessage(formData, msg);
        } else {
          result = await channel.sendMessage(body, msg);
        }

        if (result?.nonce) {
          app.queue.handleIncomingMessage(result);
        }
        app.queue.remove(nonce);
      } catch (e) {
        const error =
          e instanceof Error
            ? e.message
            : typeof e === "string"
              ? e
              : "Unknown error";

        msg.fail(error);

        const sysMessage = await createSystemMessage(
          app,
          channel.id,
          error,
          messageFlags.Ephemeral,
        );
        if (sysMessage) channel.messages.add(sysMessage);
      }
    },
    [app, channel, isDM, theyBlockedMe],
  );

  const sendMessage = useCallback(async () => {
    if (editingMessage) {
      await saveEdit(editingMessage);
      return;
    }

    if (!canSubmit()) return;

    const text = expandCustomEmoji(rawContent);
    const stickerList = stickers;
    const fileList = attachments;

    setContent("");
    setEntities([]);
    setSelection({ start: 0, end: 0 });
    setStickers([]);
    setAttachments([]);

    await sendContent(text, stickerList, fileList);
  }, [
    canSubmit,
    editingMessage,
    expandCustomEmoji,
    rawContent,
    saveEdit,
    sendContent,
    stickers,
    attachments,
  ]);

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
      const currentMember = channel.spaceId
        ? app.spaces.get(channel.spaceId)?.members.me
        : null;
      const label = getCustomEmojiLabel(
        app.expressions.all,
        expression,
        meId ?? "",
        currentMember,
        channel,
      );
      insertIntoComposer(`:${label}:`);
    },
    [app.expressions.all, app.spaces, channel, insertIntoComposer, meId],
  );

  const handleSelectGif = useCallback(
    (gif: GifResult) => {
      if (denySendingMessages || editingMessage) return;
      setContent("");
      setEntities([]);
      setSelection({ start: 0, end: 0 });
      setStickers([]);
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
      elevation={app.settings?.preferEmbossed ? 3 : 0}
      transparency={0}
      style={{
        flexShrink: 0,
        flexGrow: 0,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 12,
        paddingBottom: composerBottomPadding,
        paddingTop: editingMessage ? 0 : 12,
        borderTopWidth: 1,
        borderTopColor: `${theme.colors.neutral}33`,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
      }}
    >
      {app.replyingTo && !editingMessage && (
        <Paper
          elevation={app.settings?.preferEmbossed ? 3 : 0}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 8,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <Typography level="body-xs" textColor="secondary" style={{ flex: 1 }}>
            Replying to{" "}
            <Typography level="body-xs" weight={700} textColor="primary">
              {app.replyingTo.author?.displayName ?? "Unknown"}
            </Typography>
          </Typography>
          {app.replyingTo.authorId !== app.account?.id && (
            <Pressable onPress={() => app.setReplyMention(!app.replyMention)}>
              <Typography
                level="body-xs"
                weight={700}
                color={app.replyMention ? "info" : undefined}
                textColor={app.replyMention ? undefined : "secondary"}
              >
                {app.replyMention ? "@ ON" : "@ OFF"}
              </Typography>
            </Pressable>
          )}
          <IconButton
            padding={6}
            color="neutral"
            onPress={() => app.setReplyingTo(null)}
            accessibilityLabel="Cancel reply"
          >
            <XIcon size={20} />
          </IconButton>
        </Paper>
      )}

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
                width: feedSizes.sticker,
                height: feedSizes.sticker,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={{ uri: sticker.url }}
                style={{ width: feedSizes.asset, height: feedSizes.asset }}
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

      {attachments.length > 0 && (
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
          {attachments.map((file, index) => (
            <Box
              key={`${file.uri}-${index}`}
              style={{
                position: "relative",
                maxWidth: scaledLayoutSize(160, fontScale, 1.75),
                paddingVertical: scaledLayoutSize(6, fontScale, 1.35),
                paddingHorizontal: scaledLayoutSize(10, fontScale, 1.35),
                borderRadius: 999,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Typography
                level="body-xs"
                truncate="single"
                style={{ maxWidth: scaledLayoutSize(120, fontScale, 1.75) }}
              >
                {file.name}
              </Typography>
              <IconButton
                padding={4}
                color="neutral"
                onPress={() => removeAttachment(index)}
                accessibilityLabel="Remove attachment"
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
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
        <IconButton
          padding={6}
          color="neutral"
          onPress={() => void pickAttachments()}
          accessibilityLabel="Add attachment"
          disabled={
            denySendingMessages ||
            !!editingMessage ||
            attachments.length >= MAX_ATTACHMENTS
          }
          style={{ borderRadius: 999, marginRight: 6 }}
        >
          <PaperclipIcon size={20} weight="bold" />
        </IconButton>
        <MarkdownInput
          value={content}
          onChange={handleContentChange}
          selection={selection}
          onChangeSelection={setSelection}
          entities={entities}
          onChangeEntities={setEntities}
          channelId={channel.id}
          enableEmoticons
          placeholder={placeholder}
          editable={!denySendingMessages}
          elevation={app.settings?.preferEmbossed ? 4 : 0}
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
            minHeight: scaledLayoutSize(44, fontScale, 1.5),
            maxHeight: composerMaxHeight,
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
