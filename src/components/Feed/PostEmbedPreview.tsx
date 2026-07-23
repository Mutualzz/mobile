import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { Paper } from "@components/Paper";
import { IconButton } from "@components/IconButton";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { APIAttachment, APIMessageEmbed } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { calendarStrings } from "@mutualzz/client";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import type { Href } from "expo-router";
import {
  FileIcon,
  PlayIcon,
  ProhibitIcon,
  ArrowSquareOutIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { Image, Pressable, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  post: NonNullable<APIMessageEmbed["post"]>;
}

const THUMB_SIZE = 64;
const MAX_VISIBLE_ATTACHMENTS = 4;

function AttachmentThumb({
  attachment,
  overlayCount,
}: {
  attachment: APIAttachment;
  overlayCount?: number;
}) {
  const isImage = attachment.contentType.startsWith("image/");
  const isVideo = attachment.contentType.startsWith("video/");

  return (
    <View
      style={{
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "rgba(255, 255, 255, 0.06)",
      }}
    >
      {isImage && (
        <Image
          source={{ uri: attachment.url }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      )}

      {isVideo && (
        <View style={{ width: "100%", height: "100%" }}>
          <Image
            source={{ uri: attachment.url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <View
            style={{
              ...StyleSheetAbsoluteFill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.25)",
            }}
          >
            <PlayIcon size={18} color="#fff" weight="fill" />
          </View>
        </View>
      )}

      {!isImage && !isVideo && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FileIcon size={20} />
        </View>
      )}

      {overlayCount != null && (
        <View
          style={{
            ...StyleSheetAbsoluteFill,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.55)",
          }}
        >
          <Typography weight={700} style={{ color: "#fff" }}>
            +{overlayCount}
          </Typography>
        </View>
      )}
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export const PostEmbedPreview = observer(({ post: postData }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { navigate } = useAppNavigation();
  const { width } = useWindowDimensions();
  const { t } = useTranslation("chat");
  const cardWidth = Math.min(width - 80, 320);

  const { isLoading, isError } = useQuery({
    queryKey: ["post-embed", postData.id],
    queryFn: () => app.posts.resolve(postData.id),
  });

  const post = app.posts.get(postData.id);

  const openPost = () => {
    navigate(`/(tabs)/feed/posts/${post!.id}` as Href);
  };

  if (isError || (!isLoading && !post)) {
    return (
      <Paper
        style={{
          width: cardWidth,
          borderRadius: 8,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          borderWidth: 1,
          borderColor: theme.colors.surface,
        }}
      >
        <ProhibitIcon size={18} color={theme.typography.colors.muted} />
        <Typography level="body-sm" textColor="muted" style={{ flex: 1 }}>
          {t("feed.empty.postUnavailable")}
        </Typography>
      </Paper>
    );
  }

  if (!post) {
    return (
      <Paper
        style={{
          width: cardWidth,
          borderRadius: 8,
          padding: 12,
          borderWidth: 1,
          borderColor: theme.colors.surface,
        }}
      >
        <Typography level="body-sm" textColor="muted">
          {t("feed.embed.loadingPost")}
        </Typography>
      </Paper>
    );
  }

  const visibleAttachments = post.attachments.slice(0, MAX_VISIBLE_ATTACHMENTS);
  const hiddenAttachmentCount =
    post.attachments.length - visibleAttachments.length;

  return (
    <Pressable onPress={openPost}>
      <Paper
        style={{
          width: cardWidth,
          borderRadius: 8,
          padding: 12,
          gap: 10,
          borderWidth: 2,
          borderColor: theme.colors.primary,
        }}
      >
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              flex: 1,
              minWidth: 0,
            }}
          >
            <UserAvatar user={post.author} size="sm" />
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Typography level="body-sm" weight={600} truncate="single">
                {post.author?.displayName ?? t("unknownUser")}
              </Typography>
              <Typography level="body-xs" textColor="muted">
                {dayjs(post.createdAt).calendar(undefined, calendarStrings)}
              </Typography>
            </Box>
          </Box>

          <IconButton
            accessibilityLabel={t("feed.actions.openPost")}
            size="sm"
            onPress={openPost}
          >
            <ArrowSquareOutIcon size={16} />
          </IconButton>
        </Box>

        {post.content ? (
          <MarkdownRenderer value={post.content} />
        ) : (
          post.attachments.length > 0 && (
            <Box style={{ flexDirection: "row", gap: 8 }}>
              {visibleAttachments.map((attachment, index) => (
                <AttachmentThumb
                  key={attachment.id}
                  attachment={attachment}
                  overlayCount={
                    index === visibleAttachments.length - 1 &&
                    hiddenAttachmentCount > 0
                      ? hiddenAttachmentCount
                      : undefined
                  }
                />
              ))}
            </Box>
          )
        )}

        {post.content && post.attachments.length > 0 && (
          <Typography level="body-xs" textColor="muted">
            {t("feed.embed.attachments", { count: post.attachments.length })}
          </Typography>
        )}

        {post.hashtags.length > 0 && (
          <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
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
      </Paper>
    </Pressable>
  );
});
