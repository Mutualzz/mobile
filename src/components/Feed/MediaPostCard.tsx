import { PostAttachment } from "@components/Feed/PostAttachment";
import { PostCommentsSheet } from "@components/Feed/PostCommentsSheet";
import { PostFeedActions } from "@components/Feed/PostFeedActions";
import { PostFeedHeader } from "@components/Feed/PostFeedHeader";
import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { MessageSticker } from "@components/Message/MessageSticker";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { ExpressionType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import {
  FEED_COLUMN_MAX_WIDTH,
  FEED_MEDIA_ASPECT_RATIO,
} from "@utils/feedLayout";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Pressable,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

interface Props {
  post: Post;
  defaultCommentsOpen?: boolean;
  isActive?: boolean;
}

export const MediaPostCard = observer(
  ({ post, defaultCommentsOpen, isActive = true }: Props) => {
    const { theme } = useTheme();
    const app = useAppStore();
    const { t } = useTranslation("chat");
    const [activeIndex, setActiveIndex] = useState(0);
    const [mediaWidth, setMediaWidth] = useState(0);
    const [commentsOpen, setCommentsOpen] = useState(
      defaultCommentsOpen ?? false,
    );
    const listRef = useRef<FlatList>(null);

    const media = post.attachments;
    const mediaHeight =
      mediaWidth > 0 ? Math.round(mediaWidth / FEED_MEDIA_ASPECT_RATIO) : 0;
    const stickerExpressions = post.expressions.filter(
      (e) => e.type === ExpressionType.Sticker,
    );

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (mediaWidth <= 0) return;
      const index = Math.round(
        event.nativeEvent.contentOffset.x / mediaWidth,
      );
      setActiveIndex(index);
    };

    const scrollToIndex = (index: number) => {
      listRef.current?.scrollToIndex({ index, animated: true });
    };

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

          {post.content && <MarkdownRenderer value={post.content} />}

          {stickerExpressions.length > 0 && (
            <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {stickerExpressions.map((sticker) => (
                <MessageSticker key={sticker.id} sticker={sticker} size={64} />
              ))}
            </Box>
          )}

          <Box
            onLayout={(event) => {
              const nextWidth = Math.round(event.nativeEvent.layout.width);
              if (nextWidth !== mediaWidth) setMediaWidth(nextWidth);
            }}
            style={{
              width: "100%",
              borderRadius: 10,
              overflow: "hidden",
              backgroundColor: theme.colors.background,
              ...(mediaHeight > 0
                ? { height: mediaHeight }
                : { aspectRatio: FEED_MEDIA_ASPECT_RATIO }),
            }}
          >
            {mediaWidth > 0 && (
              <FlatList
                ref={listRef}
                horizontal
                pagingEnabled
                data={media}
                keyExtractor={(item) => item.id}
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                getItemLayout={(_, index) => ({
                  length: mediaWidth,
                  offset: mediaWidth * index,
                  index,
                })}
                renderItem={({ item, index }) => (
                  <Box style={{ width: mediaWidth, height: mediaHeight }}>
                    <PostAttachment
                      attachment={item}
                      maxWidth={mediaWidth}
                      aspectRatio={FEED_MEDIA_ASPECT_RATIO}
                      isActive={isActive && activeIndex === index}
                    />
                  </Box>
                )}
              />
            )}

            {media.length > 1 && (
              <Box
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {media.map((attachment, index) => (
                  <Pressable
                    key={attachment.id}
                    onPress={() => scrollToIndex(index)}
                    accessibilityLabel={t("feed.media.goToMediaA11y", {
                      index: index + 1,
                    })}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        index === activeIndex
                          ? theme.colors.primary
                          : theme.typography.colors.muted,
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

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
  },
);
