import { FeedVideoPlayer } from "@components/Feed/FeedVideoPlayer";
import { Paper } from "@components/Paper";
import type { APIAttachment } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { FileIcon } from "phosphor-react-native";
import { Image, Linking, Pressable, useWindowDimensions } from "react-native";

interface Props {
  attachment: APIAttachment;
  maxWidth?: number;
  aspectRatio?: number;
  fill?: boolean;
  isActive?: boolean;
}

export function PostAttachment({
  attachment,
  maxWidth,
  aspectRatio,
  fill = false,
  isActive = false,
}: Props) {
  const { theme } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const width = fill ? screenWidth : (maxWidth ?? Math.min(screenWidth - 32, 560));
  const isVideo = attachment.contentType.startsWith("video/");
  const isImage = attachment.contentType.startsWith("image/");
  const height = fill
    ? screenHeight
    : aspectRatio
      ? width / aspectRatio
      : width * 0.75;

  if (isImage) {
    return (
      <Image
        source={{ uri: attachment.url }}
        style={{
          width,
          height,
          borderRadius: fill ? 0 : 8,
        }}
        resizeMode="cover"
        accessibilityLabel={attachment.filename}
      />
    );
  }

  if (isVideo) {
    if (fill) {
      return (
        <FeedVideoPlayer
          uri={attachment.url}
          isActive={isActive}
        />
      );
    }

    return (
      <Box style={{ width, height, borderRadius: 8, overflow: "hidden" }}>
        <FeedVideoPlayer uri={attachment.url} isActive={isActive} />
      </Box>
    );
  }

  return (
    <Pressable onPress={() => Linking.openURL(attachment.url).catch(() => {})}>
      <Paper
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          padding: 12,
          borderRadius: 8,
          maxWidth: width,
        }}
        elevation={1}
      >
        <FileIcon size={20} color={theme.colors.info} />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Typography level="body-sm" truncate="single">
            {attachment.filename}
          </Typography>
        </Box>
      </Paper>
    </Pressable>
  );
}
