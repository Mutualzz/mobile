import { ExpressionPickerSheet } from "@components/Expression/ExpressionPickerSheet";
import { IconButton } from "@components/IconButton";
import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { Paper } from "@components/Paper";
import { CHAT_COMPOSER_NATIVE_ID } from "@contexts/ChatKeyboard.context";
import {
  CheckIcon,
  FileIcon,
  PaperclipIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  PlayIcon,
  SmileyIcon,
  XIcon,
} from "phosphor-react-native";
import { useAppStore } from "@hooks/useStores";
import { useComposerSafePadding } from "@hooks/useKeyboardOffset";
import { Box, scaledLayoutSize, Typography, useFontScale, useTheme } from "@mutualzz/ui-native";
import {
  useScaledComposerPanelMaxHeight,
  useScaledFeedPreviewSizes,
} from "@utils/accessibilityLayout";
import type { Channel } from "@stores/objects/Channel";
import type { Message } from "@stores/objects/Message";
import type { Expression } from "@stores/objects/Expression";
import type { GifResult } from "@utils/gifs";
import { resolveGifSendUrl } from "@utils/gifs";
import { formatRestError } from "@utils/restError";
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
import { useTranslation } from "react-i18next";
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

function extensionForAttachmentMime(mime: string, isVideo: boolean) {
  if (isVideo) {
    if (mime.includes("quicktime")) return "mov";
    return "mp4";
  }
  if (mime.includes("png")) return "png";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("heic") || mime.includes("heif")) return "heic";
  return "jpg";
}

function resolvePickedAttachmentName(
  fileName: string | null | undefined,
  mime: string,
  isVideo: boolean,
) {
  const trimmed = fileName?.trim();
  if (trimmed) return trimmed;
  return `attachment.${extensionForAttachmentMime(mime, isVideo)}`;
}

interface Props {
  channel: Channel;
}

export const MessageInput = observer(({ channel }: Props) => {
  const app = useAppStore();
  const { t } = useTranslation("chat");
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

  const canAttachFiles = isDM
    ? !denySendingMessages
    : !!space?.members.me?.canAttachFiles(channel);

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
    if (denySendingMessages || !canAttachFiles || editingMessage) return;
    if (attachments.length >= MAX_ATTACHMENTS) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 1,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });

    if (result.canceled) return;

    const next = result.assets
      .filter((a) => (a.fileSize ?? 0) <= MAX_ATTACHMENT_SIZE)
      .map((a) => {
        const isVideo = a.type === "video";
        const type =
          a.mimeType ?? (isVideo ? "video/mp4" : "image/jpeg");
        const name = resolvePickedAttachmentName(a.fileName, type, isVideo);
        return {
          uri: a.uri,
          type,
          name,
          size: a.fileSize ?? undefined,
        };
      });

    setAttachments((prev) => [...prev, ...next].slice(0, MAX_ATTACHMENTS));
  }, [attachments.length, canAttachFiles, denySendingMessages, editingMessage]);

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
        mentionReply,
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
            t("cannotMessagePerson"),
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
        const error = formatRestError(e, t("unknownError"));

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
    const fileList = canAttachFiles ? attachments : [];

    setContent("");
    setEntities([]);
    setSelection({ start: 0, end: 0 });
    setStickers([]);
    setAttachments([]);

    await sendContent(text, stickerList, fileList);
  }, [
    canAttachFiles,
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
        ? t("composer.placeholder.blocked")
        : t("composer.placeholder.noPermission");
    }

    if (editingMessage) return t("composer.placeholder.edit");

    if (isDM) {
      if (isGroupDM) {
        return channel.name
          ? t("composer.placeholder.dm", { name: channel.name })
          : t("composer.placeholder.groupFallback");
      }

      const name = channel.dmRecipient?.displayName;
      return name
        ? t("composer.placeholder.dm", { name })
        : t("composer.placeholder.dmFallback");
    }

    return channel.name
      ? t("composer.placeholder.channel", { channel: channel.name })
      : t("composer.placeholder.channelFallback");
  })();

  const handleContentChange = useCallback(
    (next: string) => {
      setContent(next);
      triggerTyping();
    },
    [triggerTyping],
  );

  const hasWallpaper = Boolean(theme.backgroundImageUrl);
  const composerElevation = app.settings?.preferEmbossed ? 3 : 0;

  return (
    <Paper
      surfaceRole={hasWallpaper ? "composer" : undefined}
      elevation={hasWallpaper ? 0 : composerElevation}
      transparency={0}
      style={{
        flexShrink: 0,
        flexGrow: 0,
        ...(hasWallpaper ? null : { backgroundColor: theme.colors.surface }),
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
          surfaceRole={hasWallpaper ? "card" : undefined}
          elevation={hasWallpaper ? 0 : composerElevation}
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
            {t("reply.banner", {
              name: app.replyingTo.author?.displayName ?? t("unknown"),
            })}
          </Typography>
          {app.replyingTo.authorId !== app.account?.id && (
            <Pressable onPress={() => app.setReplyMention(!app.replyMention)}>
              <Typography
                level="body-xs"
                weight={700}
                color={app.replyMention ? "info" : undefined}
                textColor={app.replyMention ? undefined : "secondary"}
              >
                {app.replyMention ? t("composer.mentionOn") : t("composer.mentionOff")}
              </Typography>
            </Pressable>
          )}
          <IconButton
            padding={6}
            color="neutral"
            onPress={() => app.setReplyingTo(null)}
            accessibilityLabel={t("edit.cancelReplyA11y")}
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
            {t("edit.banner")}
          </Typography>
          <IconButton
            padding={6}
            color="neutral"
            onPress={cancelEditing}
            accessibilityLabel={t("edit.cancelA11y")}
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
                accessibilityLabel={t("composer.removeSticker")}
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
          {attachments.map((file, index) => {
            const isImage = file.type.startsWith("image/");
            const isVideo = file.type.startsWith("video/");
            const previewSize = feedSizes.sticker;

            return (
              <Box
                key={`${file.uri}-${index}`}
                style={{
                  position: "relative",
                  width: isImage || isVideo ? previewSize : undefined,
                  height: isImage || isVideo ? previewSize : undefined,
                  maxWidth:
                    isImage || isVideo
                      ? undefined
                      : scaledLayoutSize(160, fontScale, 1.75),
                  paddingVertical:
                    isImage || isVideo
                      ? 0
                      : scaledLayoutSize(6, fontScale, 1.35),
                  paddingHorizontal:
                    isImage || isVideo
                      ? 0
                      : scaledLayoutSize(10, fontScale, 1.35),
                  borderRadius: isImage || isVideo ? 10 : 999,
                  overflow: "hidden",
                  backgroundColor: theme.colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                {isImage || isVideo ? (
                  <>
                    <Image
                      source={{ uri: file.uri }}
                      style={{ width: previewSize, height: previewSize }}
                      resizeMode="cover"
                      accessibilityLabel={file.name}
                    />
                    {isVideo && (
                      <Box
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(0,0,0,0.35)",
                        }}
                        pointerEvents="none"
                      >
                        <PlayIcon
                          size={22}
                          weight="fill"
                          color="#fff"
                        />
                      </Box>
                    )}
                  </>
                ) : (
                  <>
                    <FileIcon
                      size={14}
                      weight="fill"
                      color={theme.colors.info}
                    />
                    <Typography
                      level="body-xs"
                      truncate="single"
                      style={{
                        maxWidth: scaledLayoutSize(120, fontScale, 1.75),
                      }}
                    >
                      {file.name}
                    </Typography>
                  </>
                )}
                <IconButton
                  padding={4}
                  color="neutral"
                  onPress={() => removeAttachment(index)}
                  accessibilityLabel={t("composer.removeAttachment")}
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    backgroundColor: `${theme.colors.neutral}88`,
                    borderRadius: 999,
                    zIndex: 1,
                  }}
                >
                  <XIcon size={12} />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      )}

      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <IconButton
          padding={8}
          color="neutral"
          onPress={() => void pickAttachments()}
          accessibilityLabel={t("composer.addAttachment")}
          hitSlop={4}
          disabled={
            denySendingMessages ||
            !canAttachFiles ||
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
          nativeID={CHAT_COMPOSER_NATIVE_ID}
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
                accessibilityLabel={t("composer.openExpressionPicker")}
                hitSlop={4}
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
          hitSlop={4}
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
