import { Paper } from "@components/Paper";
import type { APIAttachment } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { Image } from "expo-image";
import { FileIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, useWindowDimensions } from "react-native";
import WebView from "react-native-webview";

interface Props {
  attachment: APIAttachment;
}

export function MessageAttachment({ attachment }: Props) {
  const { t } = useTranslation("common");
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(width - 96, 520);

  const isImage = attachment.contentType.startsWith("image/");
  const isVideo = attachment.contentType.startsWith("video/");

  const aspect =
    attachment.width && attachment.height
      ? attachment.width / attachment.height
      : 16 / 9;

  const mediaWidth = maxWidth;
  const mediaHeight = Math.round(mediaWidth / aspect);

  if (isImage) {
    return (
      <Image
        source={{ uri: attachment.url }}
        style={{
          width: mediaWidth,
          height: Math.min(mediaHeight, 420),
          borderRadius: 10,
        }}
        contentFit="cover"
        recyclingKey={attachment.id}
        accessibilityLabel={attachment.filename}
      />
    );
  }

  if (isVideo) {
    return (
      <Box style={{ width: mediaWidth, height: Math.min(mediaHeight, 420) }}>
        <WebView
          source={{
            html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{margin:0;background:#000}video{width:100%;height:100%;object-fit:cover}</style></head><body><video src="${attachment.url}" controls playsinline></video></body></html>`,
          }}
          style={{
            flex: 1,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: "#000",
          }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
        />
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
          padding: 10,
          borderRadius: 10,
          maxWidth: mediaWidth,
        }}
        elevation={1}
      >
        <FileIcon size={18} color={theme.colors.info} weight="fill" />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Typography level="body-sm" truncate="single">
            {attachment.filename}
          </Typography>
          <Typography level="body-xs" textColor="muted">
            {t("a11y.tapToOpen")}
          </Typography>
        </Box>
      </Paper>
    </Pressable>
  );
}

