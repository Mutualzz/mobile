import { IconButton } from "@components/IconButton";
import { Box, Typography } from "@mutualzz/ui-native";
import {
  BookmarkSimpleIcon,
  ChatCircleIcon,
  HeartIcon,
  RepeatIcon,
} from "phosphor-react-native";
import type { ReactNode } from "react";
import { Pressable, type TextStyle } from "react-native";

const OVERLAY_CHIP_BG = "rgba(0,0,0,0.32)";

const overlayCountStyle: TextStyle = {
  textShadowColor: "rgba(0,0,0,0.55)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

export function FeedOverlayChip({
  children,
  size = 40,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <Box
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: OVERLAY_CHIP_BG,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </Box>
  );
}

interface ActionProps {
  icon: React.ReactNode;
  count?: number;
  onPress?: () => void;
  active?: boolean;
  layout?: "row" | "rail";
  labelColor?: string;
  overlay?: boolean;
}

export function PostRailAction({
  icon,
  count,
  onPress,
  active,
  layout = "row",
  labelColor,
  overlay = false,
}: ActionProps) {
  const isRail = layout === "rail";
  const chipSize = isRail ? 44 : 36;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: isRail ? "column" : "row",
        alignItems: "center",
        gap: isRail ? 4 : 6,
        paddingVertical: overlay ? 0 : 4,
        paddingHorizontal: overlay ? 0 : 2,
        minWidth: isRail ? 44 : undefined,
      }}
      accessibilityRole="button"
    >
      <Box style={{ opacity: active ? 1 : 0.92 }}>
        {overlay ? (
          <FeedOverlayChip size={chipSize}>{icon}</FeedOverlayChip>
        ) : (
          icon
        )}
      </Box>
      {count != null && count > 0 && (
        <Typography
          level="body-xs"
          weight={600}
          style={{
            ...(labelColor ? { color: labelColor } : undefined),
            ...(overlay ? overlayCountStyle : undefined),
          }}
        >
          {count}
        </Typography>
      )}
    </Pressable>
  );
}

interface PostActionsProps {
  liked: boolean;
  saved: boolean;
  shared: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  commentsOpen?: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  iconColor?: string;
  layout?: "row" | "rail";
  overlay?: boolean;
}

export function PostActions({
  liked,
  saved,
  shared,
  likeCount,
  commentCount,
  shareCount,
  commentsOpen,
  onLike,
  onComment,
  onShare,
  onSave,
  iconColor,
  layout = "row",
  overlay = false,
}: PostActionsProps) {
  const weight = (active: boolean) => (active ? "fill" : "regular");
  const isRail = layout === "rail";
  const iconSize = isRail ? 28 : 22;

  const actions = (
    <>
      <PostRailAction
        layout={layout}
        active={liked}
        count={likeCount}
        onPress={onLike}
        labelColor={iconColor}
        overlay={overlay}
        icon={
          <HeartIcon size={iconSize} color={iconColor} weight={weight(liked)} />
        }
      />
      <PostRailAction
        layout={layout}
        active={!!commentsOpen}
        count={commentCount}
        onPress={onComment}
        labelColor={iconColor}
        overlay={overlay}
        icon={
          <ChatCircleIcon
            size={iconSize}
            color={iconColor}
            weight={weight(!!commentsOpen)}
          />
        }
      />
      <PostRailAction
        layout={layout}
        active={shared}
        count={shareCount}
        onPress={onShare}
        labelColor={iconColor}
        overlay={overlay}
        icon={
          <RepeatIcon
            size={iconSize}
            color={iconColor}
            weight={weight(shared)}
          />
        }
      />
      {isRail ? (
        <Pressable
          onPress={onSave}
          style={{ alignItems: "center", gap: 4 }}
          accessibilityRole="button"
          accessibilityLabel={saved ? "Unsave post" : "Save post"}
        >
          {overlay ? (
            <FeedOverlayChip size={44}>
              <BookmarkSimpleIcon
                size={iconSize}
                color={iconColor}
                weight={weight(saved)}
              />
            </FeedOverlayChip>
          ) : (
            <BookmarkSimpleIcon
              size={iconSize}
              color={iconColor}
              weight={weight(saved)}
            />
          )}
        </Pressable>
      ) : (
        <IconButton
          variant="plain"
          padding={2}
          onPress={onSave}
          accessibilityLabel={saved ? "Unsave post" : "Save post"}
        >
          <BookmarkSimpleIcon
            size={iconSize}
            color={iconColor}
            weight={weight(saved)}
          />
        </IconButton>
      )}
    </>
  );

  return (
    <Box
      style={{
        flexDirection: isRail ? "column" : "row",
        alignItems: "center",
        gap: isRail ? 18 : 20,
      }}
    >
      {actions}
    </Box>
  );
}
