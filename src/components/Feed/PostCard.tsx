import { PostActions } from "@components/Feed/PostActions";
import { PostAttachment } from "@components/Feed/PostAttachment";
import { PostCommentsSheet } from "@components/Feed/PostCommentsSheet";
import { SharePostSheet } from "@components/Feed/SharePostSheet";
import { IconButton } from "@components/IconButton";
import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { MessageEmbed } from "@components/Message/MessageEmbed";
import { MessageSticker } from "@components/Message/MessageSticker";
import { Paper } from "@components/Paper";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { ExpressionType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import { GIF_ONLY_URL_PATTERN } from "@utils/gifs";
import dayjs from "dayjs";
import { FlagIcon, TrashIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ScrollView, useWindowDimensions } from "react-native";

interface Props {
  post: Post;
  defaultCommentsOpen?: boolean;
  layout?: "card" | "snap";
  itemHeight?: number;
}

export const PostCard = observer(
  ({ post, defaultCommentsOpen, layout = "card", itemHeight }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const { openModal } = useModal();
    const { width } = useWindowDimensions();
    const isSnap = layout === "snap";
    const [commentsOpen, setCommentsOpen] = useState(defaultCommentsOpen ?? false);
    const [shareOpen, setShareOpen] = useState(false);

    const stickerExpressions = post.expressions.filter(
      (e) => e.type === ExpressionType.Sticker,
    );

    const hasGifEmbed = post.embeds.some((e) => e.type === "gifv");
    const isOnlyGifUrl =
      hasGifEmbed &&
      !!post.content &&
      GIF_ONLY_URL_PATTERN.test(post.content.trim()) &&
      !post.content.trim().includes(" ");

    const isOwner = post.authorId === app.account?.id;

    const card = (
      <Paper
        style={{
          borderRadius: 12,
          overflow: "hidden",
          padding: 14,
          gap: 12,
          width: "100%",
          maxWidth: isSnap ? Math.min(width - 24, 560) : undefined,
          alignSelf: isSnap ? "center" : undefined,
        }}
        elevation={app.settings?.preferEmbossed ? 3 : 0}
      >
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Box
            style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
          >
            <UserAvatar user={post.author} size="md" badge />
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Typography level="body-md" weight={700} truncate="single">
                {post.author?.displayName ?? "Unknown User"}
              </Typography>
              <Typography level="body-xs" textColor="muted">
                {dayjs(post.createdAt).fromNow()}
              </Typography>
            </Box>
          </Box>

          {isOwner ? (
            <IconButton
              variant="plain"
              color="danger"
              padding={6}
              onPress={() => void post.delete()}
              accessibilityLabel="Delete post"
            >
              <TrashIcon size={18} />
            </IconButton>
          ) : (
            <IconButton
              variant="plain"
              color="danger"
              padding={6}
              onPress={() =>
                openModal(
                  `report-post-${post.id}`,
                  <ReportContentSheet
                    targetType="post"
                    targetId={post.id}
                    contentLabel="this post"
                    modalId={`report-post-${post.id}`}
                  />,
                )
              }
              accessibilityLabel="Report post"
            >
              <FlagIcon size={18} />
            </IconButton>
          )}
        </Box>

        {stickerExpressions.length > 0 && (
          <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {stickerExpressions.map((sticker) => (
              <MessageSticker key={sticker.id} sticker={sticker} size={80} />
            ))}
          </Box>
        )}

        {post.content && !isOnlyGifUrl && (
          <MarkdownRenderer value={post.content} />
        )}

        {post.embeds.length > 0 && (
          <Box style={{ gap: 8 }}>
            {post.embeds.map((embed, index) => (
              <MessageEmbed key={index} embed={embed} />
            ))}
          </Box>
        )}

        {post.attachments.length > 0 && (
          <Box style={{ gap: 8 }}>
            {post.attachments.map((attachment) => (
              <PostAttachment
                key={attachment.id}
                attachment={attachment}
                maxWidth={width - 56}
              />
            ))}
          </Box>
        )}

        {post.hashtags.length > 0 && (
          <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {post.hashtags.map((hashtag) => (
              <Typography
                key={hashtag.id}
                level="body-sm"
                style={{ color: theme.colors.info }}
              >
                #{hashtag.tag}
              </Typography>
            ))}
          </Box>
        )}

        <PostActions
          liked={post.liked}
          saved={post.saved}
          shared={post.shared}
          likeCount={post.likeCount}
          commentCount={post.commentCount}
          shareCount={post.shareCount}
          commentsOpen={commentsOpen}
          iconColor={theme.typography.colors.primary}
          onLike={() => void post.toggleLike()}
          onComment={() => setCommentsOpen(true)}
          onShare={() => setShareOpen(true)}
          onSave={() => void post.toggleSave()}
        />
      </Paper>
    );

    return (
      <>
        {isSnap ? (
          <Box
            style={{
              height: itemHeight,
              width: "100%",
              justifyContent: "center",
              paddingHorizontal: 12,
            }}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                paddingVertical: 16,
              }}
              showsVerticalScrollIndicator={false}
            >
              {card}
            </ScrollView>
          </Box>
        ) : (
          card
        )}

        <PostCommentsSheet
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          post={post}
        />

        <SharePostSheet
          visible={shareOpen}
          post={post}
          onClose={() => setShareOpen(false)}
        />
      </>
    );
  },
);
