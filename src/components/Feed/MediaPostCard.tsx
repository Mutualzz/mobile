import { PostActions, FeedOverlayChip } from "@components/Feed/PostActions";
import { PostAttachment } from "@components/Feed/PostAttachment";
import { PostCommentsSheet } from "@components/Feed/PostCommentsSheet";
import { SharePostSheet } from "@components/Feed/SharePostSheet";
import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { MessageSticker } from "@components/Message/MessageSticker";
import { Paper } from "@components/Paper";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { ExpressionType } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import { useScaledFeedPreviewSizes } from "@utils/accessibilityLayout";
import { MODE_SWITCHER_SNAP_CLEARANCE } from "@utils/layout";
import { FlagIcon, TrashIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

interface Props {
  post: Post;
  defaultCommentsOpen?: boolean;
  layout?: "card" | "snap";
  itemHeight?: number;
  isActive?: boolean;
}

export const MediaPostCard = observer(
  ({
    post,
    defaultCommentsOpen,
    layout = "card",
    itemHeight,
    isActive = false,
  }: Props) => {
    const app = useAppStore();
    const feedSizes = useScaledFeedPreviewSizes();
    const { openModal } = useModal();
    const { width } = useWindowDimensions();
    const isSnap = layout === "snap";
    const cardWidth = isSnap ? width : Math.min(width - 24, 420);
    const cardHeight = isSnap
      ? (itemHeight ?? width * (16 / 9))
      : Math.round(cardWidth * (16 / 9));
    const [activeIndex, setActiveIndex] = useState(0);
    const [commentsOpen, setCommentsOpen] = useState(
      defaultCommentsOpen ?? false,
    );
    const [shareOpen, setShareOpen] = useState(false);
    const listRef = useRef<FlatList>(null);

    const media = post.attachments;
    const stickerExpressions = post.expressions.filter(
      (e) => e.type === ExpressionType.Sticker,
    );
    const isOwner = post.authorId === app.account?.id;
    const snapActionsBottom = MODE_SWITCHER_SNAP_CLEARANCE + 12;

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
      setActiveIndex(index);
    };

    const overlayContent = (
      <>
        <Box
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 2,
          }}
        >
          {isOwner ? (
            <Pressable
              onPress={() => void post.delete()}
              accessibilityLabel="Delete post"
              accessibilityRole="button"
            >
              <FeedOverlayChip size={36}>
                <TrashIcon size={18} color="#fff" />
              </FeedOverlayChip>
            </Pressable>
          ) : (
            <Pressable
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
              accessibilityRole="button"
            >
              <FeedOverlayChip size={36}>
                <FlagIcon size={18} color="#fff" />
              </FeedOverlayChip>
            </Pressable>
          )}
        </Box>

        <Box
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 72,
            padding: isSnap ? 16 : 12,
            paddingBottom: isSnap ? 20 : 12,
            gap: 6,
            zIndex: 2,
          }}
        >
          <Box style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <UserAvatar user={post.author} size="sm" />
            <Typography
              level="body-sm"
              weight={700}
              style={{ color: "#fff" }}
              truncate="single"
            >
              {post.author?.displayName ?? "Unknown User"}
            </Typography>
          </Box>

          {post.content ? (
            <Box style={{ maxHeight: isSnap ? feedSizes.snapStickerMaxHeight : undefined }}>
              <MarkdownRenderer value={post.content} />
            </Box>
          ) : null}

          {stickerExpressions.length > 0 && (
            <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {stickerExpressions.map((sticker) => (
                <MessageSticker key={sticker.id} sticker={sticker} size={feedSizes.commentSticker} />
              ))}
            </Box>
          )}
        </Box>

        <Box
          style={{
            position: "absolute",
            right: isSnap ? 10 : 8,
            bottom: isSnap ? snapActionsBottom : 16,
            zIndex: 2,
          }}
        >
          <PostActions
            layout={isSnap ? "rail" : "row"}
            overlay
            liked={post.liked}
            saved={post.saved}
            shared={post.shared}
            likeCount={post.likeCount}
            commentCount={post.commentCount}
            shareCount={post.shareCount}
            iconColor="#fff"
            onLike={() => void post.toggleLike()}
            onComment={() => setCommentsOpen(true)}
            onShare={() => setShareOpen(true)}
            onSave={() => void post.toggleSave()}
          />
        </Box>
      </>
    );

    const mediaCarousel = (
      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        data={media}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Box style={{ width: cardWidth, height: cardHeight }}>
            <PostAttachment
              attachment={item}
              maxWidth={cardWidth}
              aspectRatio={cardWidth / cardHeight}
              fill={isSnap}
              isActive={isActive && activeIndex === index}
            />
          </Box>
        )}
      />
    );

    const pageIndicators =
      media.length > 1 ? (
        <Box
          style={{
            position: "absolute",
            bottom: isSnap ? snapActionsBottom + 64 : 12,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
            zIndex: 2,
          }}
        >
          {media.map((attachment, index) => (
            <Pressable
              key={attachment.id}
              onPress={() =>
                listRef.current?.scrollToIndex({ index, animated: true })
              }
              style={{
                width: feedSizes.pageDot,
                height: feedSizes.pageDot,
                borderRadius: feedSizes.pageDot / 2,
                backgroundColor:
                  index === activeIndex ? "#fff" : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </Box>
      ) : null;

    return (
      <>
        {isSnap ? (
          <Box
            style={{
              width: cardWidth,
              height: cardHeight,
              backgroundColor: "#000",
              overflow: "hidden",
            }}
          >
            {mediaCarousel}
            <Box
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: feedSizes.gradientOverlayHeight,
                backgroundColor: "rgba(0,0,0,0.35)",
              }}
            />
            {pageIndicators}
            {overlayContent}
          </Box>
        ) : (
          <Box style={{ alignItems: "center" }}>
            <Paper
              style={{
                width: cardWidth,
                height: cardHeight,
                borderRadius: 12,
                overflow: "hidden",
              }}
              elevation={app.settings?.preferEmbossed ? 4 : 0}
            >
              {mediaCarousel}
              {pageIndicators}
              {overlayContent}
            </Paper>
          </Box>
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
