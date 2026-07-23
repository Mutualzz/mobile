import { CHAT_COMPOSER_NATIVE_ID } from "@contexts/ChatKeyboard.context";
import { ChatListScrollView } from "@components/Keyboard";
import { KeyboardComposer } from "@components/Keyboard/KeyboardComposer";
import { CommentActionSheet } from "@components/Feed/CommentActionSheet";
import { ExpressionPickerSheet } from "@components/Expression/ExpressionPickerSheet";
import { IconButton } from "@components/IconButton";
import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { MessageEmbed } from "@components/Message/MessageEmbed";
import { MessageSticker } from "@components/Message/MessageSticker";
import { UserAvatar } from "@components/User/UserAvatar";
import { useOpenBottomSheet } from "@hooks/useOpenBottomSheet";
import { ExpressionType } from "@mutualzz/types";
import { Box, Button, Typography, useTheme } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import type { PostComment } from "@stores/objects/PostComment";
import type { Expression } from "@stores/objects/Expression";
import type { GifResult } from "@utils/gifs";
import { GIF_ONLY_URL_PATTERN, resolveGifSendUrl } from "@utils/gifs";
import { useScaledFeedPreviewSizes } from "@utils/accessibilityLayout";
import {
  buildCommentThreads,
  COMMENTS_PAGE_SIZE,
  getOldestCommentId,
  REPLY_PREVIEW_COUNT,
  type CommentSort,
} from "@utils/postComments";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  ChatCircleIcon,
  DotsThreeIcon,
  SmileyIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  XIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable } from "react-native";

interface Props {
  post: Post;
}

const MAX_STICKERS = 3;

function CommentBody({
  comment,
  isReply = false,
}: {
  comment: PostComment;
  isReply?: boolean;
}) {
  const feedSizes = useScaledFeedPreviewSizes();
  const { theme } = useTheme();
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
    <Box
      style={{
        gap: 8,
        padding: isReply ? 0 : 12,
        borderRadius: 8,
        backgroundColor: isReply
          ? "transparent"
          : `${theme.colors.background}88`,
      }}
    >
      {comment.content && !isOnlyGifUrl && (
        <MarkdownRenderer value={comment.content} />
      )}
      {stickerExpressions.length > 0 && (
        <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {stickerExpressions.map((sticker) => (
            <MessageSticker
              key={sticker.id}
              sticker={sticker}
              size={feedSizes.commentSticker}
            />
          ))}
        </Box>
      )}
      {comment.embeds.length > 0 && (
        <Box style={{ gap: 6 }}>
          {comment.embeds.map((embed, index) => (
            <MessageEmbed key={index} embed={embed} compact />
          ))}
        </Box>
      )}
    </Box>
  );
}

function CommentRow({
  comment,
  onReply,
  onOpenActions,
  isActive = false,
  isReply = false,
}: {
  comment: PostComment;
  onReply: (comment: PostComment) => void;
  onOpenActions: (comment: PostComment) => void;
  isActive?: boolean;
  isReply?: boolean;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation("chat");

  return (
    <Pressable
      onLongPress={() => onOpenActions(comment)}
      delayLongPress={250}
      style={{
        flexDirection: "row",
        gap: 10,
        borderRadius: 10,
        outlineWidth: isActive ? 2 : 0,
        outlineColor: `${theme.colors.primary}66`,
        outlineStyle: "solid",
      }}
    >
      <UserAvatar user={comment.author} size="sm" />
      <Box style={{ flex: 1, minWidth: 0, gap: 10 }}>
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Box
            style={{
              flex: 1,
              minWidth: 0,
              flexDirection: "row",
              alignItems: "baseline",
              gap: 6,
            }}
          >
            <Typography level="body-sm" weight={700} truncate="single">
              {comment.author?.displayName ?? t("unknownUser")}
            </Typography>
            <Typography level="body-xs" textColor="muted">
              {dayjs(comment.createdAt).fromNow()}
            </Typography>
          </Box>
          <IconButton
            variant="plain"
            padding={4}
            onPress={() => onOpenActions(comment)}
            accessibilityLabel={t("feed.comments.reply")}
          >
            <DotsThreeIcon size={16} />
          </IconButton>
        </Box>

        <CommentBody comment={comment} isReply={isReply} />

        <Pressable onPress={() => onReply(comment)}>
          <Typography level="body-xs" weight={600} textColor="muted">
            {t("feed.comments.reply")}
          </Typography>
        </Pressable>
      </Box>
    </Pressable>
  );
}

function ReplyThread({
  replies,
  onReply,
  onOpenActions,
  replyingToId,
}: {
  replies: PostComment[];
  onReply: (comment: PostComment) => void;
  onOpenActions: (comment: PostComment) => void;
  replyingToId?: string | null;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation("chat");
  const [expanded, setExpanded] = useState(
    replies.length <= REPLY_PREVIEW_COUNT,
  );

  if (replies.length === 0) return null;

  const hiddenCount = Math.max(0, replies.length - REPLY_PREVIEW_COUNT);
  const visibleReplies = expanded
    ? replies
    : replies.slice(0, REPLY_PREVIEW_COUNT);

  return (
    <Box
      style={{
        paddingLeft: 36,
        paddingTop: 4,
        gap: 14,
        borderLeftWidth: 2,
        borderLeftColor: theme.typography.colors.muted,
      }}
    >
      {visibleReplies.map((reply) => (
        <CommentRow
          key={reply.id}
          comment={reply}
          onReply={onReply}
          onOpenActions={onOpenActions}
          isReply
          isActive={replyingToId === reply.id}
        />
      ))}

      {!expanded && hiddenCount > 0 && (
        <Pressable onPress={() => setExpanded(true)}>
          <Typography level="body-xs" weight={600} textColor="muted">
            {t("feed.comments.viewReplies", { count: hiddenCount })}
          </Typography>
        </Pressable>
      )}

      {expanded && replies.length > REPLY_PREVIEW_COUNT && (
        <Pressable onPress={() => setExpanded(false)}>
          <Typography level="body-xs" weight={600} textColor="muted">
            {t("feed.comments.hideReplies")}
          </Typography>
        </Pressable>
      )}
    </Box>
  );
}

export const PostComments = observer(({ post }: Props) => {
  const { theme } = useTheme();
  const { t } = useTranslation("chat");
  const { openBottomSheet, closeBottomSheet } = useOpenBottomSheet();
  const feedSizes = useScaledFeedPreviewSizes();
  const [content, setContent] = useState("");
  const [stickers, setStickers] = useState<Expression[]>([]);
  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [sort, setSort] = useState<CommentSort>("newest");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionComment, setActionComment] = useState<PostComment | null>(null);
  const listRef = useRef<any>(null);

  const { isLoading } = useQuery({
    queryKey: ["post-comments", post.id],
    queryFn: async () => {
      const batch = await post.getComments({ limit: COMMENTS_PAGE_SIZE });
      setHasMore(batch.length >= COMMENTS_PAGE_SIZE);
      return batch;
    },
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
    setSort("newest");
    setHasMore(false);
  }, [post.id]);

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

  const loadMore = async () => {
    const before = getOldestCommentId(post.comments.all);
    if (!before || loadingMore) return;

    setLoadingMore(true);
    try {
      const batch = await post.loadMoreComments(before, COMMENTS_PAGE_SIZE);
      setHasMore(batch.length >= COMMENTS_PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  };

  const canSubmit = !!content.trim() || stickers.length > 0;
  const threads = buildCommentThreads(post.comments.all, sort);
  const showSort = !isLoading && post.comments.count > 1;

  return (
    <>
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
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: `${theme.colors.primary}14`,
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

            <Box
              style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}
            >
              <Box style={{ flex: 1 }}>
                <MarkdownInput
                  value={content}
                  onChange={setContent}
                  selection={selection}
                  onChangeSelection={setSelection}
                  nativeID={CHAT_COMPOSER_NATIVE_ID}
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
              <IconButton variant="plain" padding={6} onPress={openPicker}>
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
        <ChatListScrollView
          ref={listRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 18, paddingBottom: 12, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
        >
          {showSort && (
            <Box
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 4,
              }}
            >
              <IconButton
                variant={sort === "newest" ? "soft" : "plain"}
                padding={6}
                onPress={() => setSort("newest")}
                accessibilityLabel={t("feed.comments.sortNewest")}
              >
                <SortDescendingIcon size={18} />
              </IconButton>
              <IconButton
                variant={sort === "oldest" ? "soft" : "plain"}
                padding={6}
                onPress={() => setSort("oldest")}
                accessibilityLabel={t("feed.comments.sortOldest")}
              >
                <SortAscendingIcon size={18} />
              </IconButton>
            </Box>
          )}

          {isLoading && (
            <Typography level="body-sm" textColor="muted">
              {t("feed.comments.loading")}
            </Typography>
          )}

          {!isLoading && post.comments.count === 0 && (
            <Box style={{ alignItems: "center", gap: 8, paddingVertical: 24 }}>
              <ChatCircleIcon size={28} color={theme.typography.colors.muted} />
              <Typography level="body-sm" textColor="muted">
                {t("feed.empty.comments")}
              </Typography>
            </Box>
          )}

          {threads.map(({ comment, replies }) => (
            <Box key={comment.id} style={{ gap: 16 }}>
              <CommentRow
                comment={comment}
                onReply={handleReply}
                onOpenActions={setActionComment}
                isActive={replyingTo?.id === comment.id}
              />

              <ReplyThread
                replies={replies}
                onReply={handleReply}
                onOpenActions={setActionComment}
                replyingToId={replyingTo?.id}
              />
            </Box>
          ))}

          {hasMore && (
            <Button
              variant="plain"
              loading={loadingMore}
              onPress={() => void loadMore()}
            >
              {loadingMore
                ? t("feed.comments.loadingMore")
                : t("feed.comments.loadMore")}
            </Button>
          )}
        </ChatListScrollView>
      </KeyboardComposer>

      {actionComment && (
        <CommentActionSheet
          post={post}
          comment={actionComment}
          visible={!!actionComment}
          onClose={() => setActionComment(null)}
          onReply={handleReply}
        />
      )}
    </>
  );
});
