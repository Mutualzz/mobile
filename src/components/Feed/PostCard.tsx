import { PostCommentsSheet } from "@components/Feed/PostCommentsSheet";
import { PostFeedActions } from "@components/Feed/PostFeedActions";
import { PostFeedHeader } from "@components/Feed/PostFeedHeader";
import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { MessageEmbed } from "@components/Message/MessageEmbed";
import { MessageSticker } from "@components/Message/MessageSticker";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { ExpressionType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import { GIF_ONLY_URL_PATTERN } from "@utils/gifs";
import { FEED_COLUMN_MAX_WIDTH } from "@utils/feedLayout";
import { observer } from "mobx-react-lite";
import { useState } from "react";

interface Props {
  post: Post;
  defaultCommentsOpen?: boolean;
}

export const PostCard = observer(({ post, defaultCommentsOpen }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const [commentsOpen, setCommentsOpen] = useState(defaultCommentsOpen ?? false);

  const stickerExpressions = post.expressions.filter(
    (e) => e.type === ExpressionType.Sticker,
  );

  const hasGifEmbed = post.embeds.some((e) => e.type === "gifv");
  const isOnlyGifUrl =
    hasGifEmbed &&
    !!post.content &&
    GIF_ONLY_URL_PATTERN.test(post.content.trim()) &&
    !post.content.trim().includes(" ");

  return (
    <>
      <Paper
        style={{
          width: "100%",
          maxWidth: FEED_COLUMN_MAX_WIDTH,
          alignSelf: "center",
          borderRadius: 12,
          overflow: "hidden",
          padding: 12,
          gap: 10,
        }}
        elevation={app.settings?.preferEmbossed ? 4 : 0}
      >
        <PostFeedHeader post={post} />

        {stickerExpressions.length > 0 && (
          <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {stickerExpressions.map((sticker) => (
              <MessageSticker key={sticker.id} sticker={sticker} size={64} />
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

        <PostFeedActions
          post={post}
          commentsActive={commentsOpen}
          onOpenComments={() => setCommentsOpen(true)}
        />
      </Paper>

      <PostCommentsSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        post={post}
      />
    </>
  );
});
