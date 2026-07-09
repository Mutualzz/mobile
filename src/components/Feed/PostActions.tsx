import { IconButton } from "@components/IconButton";
import { Box, Typography } from "@mutualzz/ui-native";
import {
  BookmarkSimpleIcon,
  ChatCircleIcon,
  HeartIcon,
  RepeatIcon,
} from "phosphor-react-native";
import { Pressable } from "react-native";

interface ActionProps {
  icon: React.ReactNode;
  count?: number;
  onPress?: () => void;
  active?: boolean;
  layout?: "row" | "rail";
  labelColor?: string;
}

export function PostRailAction({
  icon,
  count,
  onPress,
  active,
  layout = "row",
  labelColor,
}: ActionProps) {
  const isRail = layout === "rail";

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: isRail ? "column" : "row",
        alignItems: "center",
        gap: isRail ? 4 : 6,
        paddingVertical: 4,
        paddingHorizontal: 2,
        minWidth: isRail ? 44 : undefined,
      }}
      accessibilityRole="button"
    >
      <Box style={{ opacity: active ? 1 : 0.85 }}>{icon}</Box>
      {count != null && count > 0 ? (
        <Typography
          level="body-xs"
          weight={600}
          style={labelColor ? { color: labelColor } : undefined}
        >
          {count}
        </Typography>
      ) : null}
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
        icon={
          <HeartIcon
            size={iconSize}
            color={iconColor}
            weight={weight(liked)}
          />
        }
      />
      <PostRailAction
        layout={layout}
        active={!!commentsOpen}
        count={commentCount}
        onPress={onComment}
        labelColor={iconColor}
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
          style={{ alignItems: "center", gap: 4, paddingVertical: 4 }}
          accessibilityRole="button"
          accessibilityLabel={saved ? "Unsave post" : "Save post"}
        >
          <BookmarkSimpleIcon
            size={iconSize}
            color={iconColor}
            weight={weight(saved)}
          />
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
