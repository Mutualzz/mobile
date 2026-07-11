import { KeyboardComposer } from "@components/Keyboard/KeyboardComposer";
import { ExpressionPickerSheet } from "@components/Expression/ExpressionPickerSheet";
import { IconButton } from "@components/IconButton";
import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { MessageEmbed } from "@components/Message/MessageEmbed";
import { MessageSticker } from "@components/Message/MessageSticker";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { useModal } from "@hooks/useModal";
import { useOpenBottomSheet } from "@hooks/useOpenBottomSheet";
import { useAppStore } from "@hooks/useStores";
import { useOnKeyboardOpen } from "@hooks/useKeyboardOffset";
import { ExpressionType } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import type { PostComment } from "@stores/objects/PostComment";
import type { Expression } from "@stores/objects/Expression";
import type { GifResult } from "@utils/gifs";
import { GIF_ONLY_URL_PATTERN, resolveGifSendUrl } from "@utils/gifs";
import { useScaledFeedPreviewSizes } from "@utils/accessibilityLayout";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  ChatCircleIcon,
  FlagIcon,
  SmileyIcon,
  TrashIcon,
  XIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Keyboard, Pressable, ScrollView } from "react-native";

interface Props {
  post: Post;
}

const MAX_STICKERS = 3;

function CommentBody({ comment }: { comment: PostComment }) {
  const feedSizes = useScaledFeedPreviewSizes();
  const stickerExpressions = comment.expressions.filter(
    (e) => e.type === ExpressionType.Sticker,
  );
  const hasGifEmbed = comment.embeds.some((e) => e.type === "gifv");
  const isOnlyGifUrl =
    hasGifEmbed &&
    !!comment.content &&
    GIF_ONLY_URL_PATTERN.test(comment.content.trim()) &&
    !comment.content.trim().includes(" ");

  return (
    <>
      {comment.content && !isOnlyGifUrl && (
        <MarkdownRenderer value={comment.content} />
      )}
      {stickerExpressions.length > 0 && (
        <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {stickerExpressions.map((sticker) => (
            <MessageSticker key={sticker.id} sticker={sticker} size={feedSizes.commentSticker} />
          ))}
        </Box>
      )}
      {comment.embeds.length > 0 && (
        <Box style={{ gap: 6 }}>
          {comment.embeds.map((embed, index) => (
            <MessageEmbed key={index} embed={embed} />
          ))}
        </Box>
      )}
    </>
  );
}

function CommentRow({
  comment,
  canDelete,
  canReport,
  onReply,
}: {
  comment: PostComment;
  canDelete: boolean;
  canReport: boolean;
  onReply: (comment: PostComment) => void;
}) {
  const { openModal } = useModal();
  const { t } = useTranslation("chat");

  return (
    <Box style={{ flexDirection: "row", gap: 10 }}>
      <UserAvatar user={comment.author} size="sm" />
      <Box style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Typography level="body-sm" weight={700} truncate="single">
              {comment.author?.displayName ?? t("unknownUser")}
            </Typography>
            <Typography level="body-xs" textColor="muted">
              {dayjs(comment.createdAt).fromNow()}
            </Typography>
          </Box>
          <Box style={{ flexDirection: "row", gap: 4 }}>
            {canDelete && (
              <IconButton
                variant="plain"
                color="danger"
                padding={4}
                onPress={() => void comment.delete()}
              >
                <TrashIcon size={16} />
              </IconButton>
            )}
            {canReport && (
              <IconButton
                variant="plain"
                color="danger"
                padding={4}
                onPress={() =>
                  openModal(
                    `report-comment-${comment.id}`,
                    <ReportContentSheet
                      targetType="comment"
                      targetId={comment.id}
                      contentLabel={t("feed.report.thisComment")}
                      modalId={`report-comment-${comment.id}`}
                    />,
                  )
                }
              >
                <FlagIcon size={16} />
              </IconButton>
            )}
          </Box>
        </Box>

        <CommentBody comment={comment} />

        <Pressable onPress={() => onReply(comment)}>
          <Typography level="body-xs" weight={600} textColor="muted">
            {t("feed.comments.reply")}
          </Typography>
        </Pressable>
      </Box>
    </Box>
  );
}

export const PostComments = observer(({ post }: Props) => {
  const app = useAppStore();
  const { t } = useTranslation("chat");
  const { openBottomSheet, closeBottomSheet } = useOpenBottomSheet();
  const feedSizes = useScaledFeedPreviewSizes();
  const scrollRef = useRef<ScrollView>(null);
  const [content, setContent] = useState("");
  const [stickers, setStickers] = useState<Expression[]>([]);
  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const { isLoading } = useQuery({
    queryKey: ["post-comments", post.id],
    queryFn: () => post.getComments(),
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      post.addComment(
        content.trim(),
        stickers.map((s) => s.id),
        replyingTo?.id,
      ),
    onSuccess: () => {
      setContent("");
      setStickers([]);
      setReplyingTo(null);
    },
  });

  useEffect(() => {
    setContent("");
    setStickers([]);
    setReplyingTo(null);
  }, [post.id]);

  const handleKeyboardOpen = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  useOnKeyboardOpen(handleKeyboardOpen);

  const handleSelectSticker = (sticker: Expression) => {
    setStickers((prev) => {
      if (prev.some((s) => s.id === sticker.id)) return prev;
      if (prev.length >= MAX_STICKERS) return prev;
      return [...prev, sticker];
    });
    closeBottomSheet("post-comment-picker");
  };

  const handleGif = (gif: GifResult) => {
    const url = resolveGifSendUrl(gif);
    const needsSpace = content.length > 0 && !/\s$/.test(content);
    setContent((prev) => `${prev}${needsSpace ? " " : ""}${url}`);
    closeBottomSheet("post-comment-picker");
  };

  const openPicker = () => {
    openBottomSheet(
      "post-comment-picker",
      <ExpressionPickerSheet
        embedded
        onClose={() => closeBottomSheet("post-comment-picker")}
        initialTab="stickers"
        onSelectEmoji={() => closeBottomSheet("post-comment-picker")}
        onSelectCustomEmoji={() => closeBottomSheet("post-comment-picker")}
        onSelectSticker={handleSelectSticker}
        onSelectGif={handleGif}
        showStickers
      />,
    );
  };

  const handleReply = (comment: PostComment) => {
    setReplyingTo(comment);
    if (comment.repliedToId) {
      const mentionName = comment.author?.displayName ?? "user";
      setContent(`@${mentionName} `);
    } else {
      setContent("");
    }
  };

  const canSubmit = !!content.trim() || stickers.length > 0;

  const canDeleteComment = (comment: PostComment) =>
    comment.authorId === app.account?.id || post.authorId === app.account?.id;

  const canReportComment = (comment: PostComment) =>
    comment.authorId !== app.account?.id;

  const topLevelComments = post.comments.all.filter((c) => !c.repliedToId);
  const repliesByParentId = new Map<string, PostComment[]>();
  for (const comment of post.comments.all) {
    if (!comment.repliedToId) continue;
    const list = repliesByParentId.get(comment.repliedToId) ?? [];
    list.push(comment);
    repliesByParentId.set(comment.repliedToId, list);
  }

  return (
    <KeyboardComposer
      footer={
        <Box
          style={{
            flexShrink: 0,
            gap: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: "rgba(128,128,128,0.2)",
          }}
        >
          {replyingTo && (
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography level="body-xs" textColor="muted">
                {t("reply.banner", {
                  name: replyingTo.author?.displayName ?? t("unknown"),
                })}
              </Typography>
              <IconButton
                variant="plain"
                padding={4}
                onPress={() => setReplyingTo(null)}
              >
                <XIcon size={14} />
              </IconButton>
            </Box>
          )}

          {stickers.length > 0 && (
            <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {stickers.map((sticker) => (
                <Box key={sticker.id} style={{ position: "relative" }}>
                  <Image
                    source={{ uri: sticker.url }}
                    style={{
                      width: feedSizes.commentSticker,
                      height: feedSizes.commentSticker,
                    }}
                    resizeMode="contain"
                  />
                  <IconButton
                    variant="plain"
                    padding={2}
                    onPress={() =>
                      setStickers((prev) =>
                        prev.filter((s) => s.id !== sticker.id),
                      )
                    }
                    style={{ position: "absolute", top: -4, right: -4 }}
                  >
                    <XIcon size={12} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          <Box style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
            <Box style={{ flex: 1 }}>
              <MarkdownInput
                value={content}
                onChange={setContent}
                selection={selection}
                onChangeSelection={setSelection}
                placeholder={
                  replyingTo
                    ? t("feed.comments.replyPlaceholder", {
                        name:
                          replyingTo.author?.displayName ??
                          t("feed.comments.replyFallback"),
                      })
                    : t("feed.comments.placeholder")
                }
                style={{ minHeight: feedSizes.commentComposerMinHeight }}
              />
            </Box>
            <IconButton
              variant="plain"
              padding={6}
              onPress={openPicker}
            >
              <SmileyIcon size={20} />
            </IconButton>
            <IconButton
              variant="plain"
              padding={6}
              disabled={!canSubmit || isPending}
              onPress={() => submit()}
            >
              <ChatCircleIcon size={20} weight="fill" />
            </IconButton>
          </Box>
        </Box>
      }
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
        onTouchStart={() => Keyboard.dismiss()}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <Typography level="body-sm" textColor="muted">
            {t("feed.comments.loading")}
          </Typography>
        )}

        {!isLoading && post.comments.count === 0 && (
          <Typography level="body-sm" textColor="muted">
            {t("feed.empty.comments")}
          </Typography>
        )}

        {topLevelComments.map((comment) => (
          <Box key={comment.id} style={{ gap: 10 }}>
            <CommentRow
              comment={comment}
              canDelete={canDeleteComment(comment)}
              canReport={canReportComment(comment)}
              onReply={handleReply}
            />

            {(repliesByParentId.get(comment.id) ?? []).length > 0 && (
              <Box style={{ paddingLeft: 36, gap: 10 }}>
                {(repliesByParentId.get(comment.id) ?? []).map((reply) => (
                  <CommentRow
                    key={reply.id}
                    comment={reply}
                    canDelete={canDeleteComment(reply)}
                    canReport={canReportComment(reply)}
                    onReply={handleReply}
                  />
                ))}
              </Box>
            )}
          </Box>
        ))}
      </ScrollView>
    </KeyboardComposer>
  );
});
