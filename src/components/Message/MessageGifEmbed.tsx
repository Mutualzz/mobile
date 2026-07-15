import { IconButton } from "@components/IconButton";
import { useTheme } from "@mutualzz/ui-native";
import {
  computeContainedSize,
  getMessageGifMaxWidth,
  MESSAGE_GIF_MAX_HEIGHT,
} from "@utils/gifs";
import { buildVideoHtml, VIDEO_SIZE_SCRIPT } from "@utils/webViewVideo";
import { Image as ExpoImage } from "expo-image";
import { StarIcon } from "phosphor-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

interface Props {
  mediaUrl: string;
  imageUrl?: string | null;
  pageUrl?: string | null;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

type NaturalSize = { width: number; height: number };

const naturalSizeCache = new Map<string, NaturalSize>();

function cacheKeyFor(mediaUrl: string, imageUrl?: string | null) {
  return imageUrl || mediaUrl;
}

export function MessageGifEmbed({
  mediaUrl,
  imageUrl,
  pageUrl,
  isFavorited,
  onToggleFavorite,
}: Props) {
  const { t } = useTranslation("chat");
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const maxWidth = getMessageGifMaxWidth(windowWidth);
  const maxHeight = MESSAGE_GIF_MAX_HEIGHT;

  const isVideo = /\.(mp4|webm)(\?|$)/i.test(mediaUrl);
  const sizingUri = imageUrl || (!isVideo ? mediaUrl : null);
  const cacheKey = cacheKeyFor(mediaUrl, imageUrl);

  const lockedRef = useRef(naturalSizeCache.has(cacheKey));
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(
    () => naturalSizeCache.get(cacheKey) ?? null,
  );

  const lockSize = useCallback((width: number, height: number) => {
    if (lockedRef.current || !width || !height) return;
    lockedRef.current = true;
    const next = { width, height };
    naturalSizeCache.set(cacheKey, next);
    setNaturalSize(next);
  }, [cacheKey]);

  useEffect(() => {
    lockedRef.current = naturalSizeCache.has(cacheKey);
    setNaturalSize(naturalSizeCache.get(cacheKey) ?? null);
  }, [cacheKey]);

  useEffect(() => {
    if (!sizingUri || lockedRef.current) return;

    let cancelled = false;
    Image.getSize(
      sizingUri,
      (width, height) => {
        if (cancelled) return;
        lockSize(width, height);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [sizingUri, lockSize]);

  const handleVideoMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (sizingUri || lockedRef.current) return;
      try {
        const data = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          width?: number;
          height?: number;
        };
        if (data.type !== "size" || !data.width || !data.height) return;
        lockSize(data.width, data.height);
      } catch {
      }
    },
    [lockSize, sizingUri],
  );

  const displaySize = useMemo(
    () =>
      computeContainedSize(
        naturalSize?.width ?? 0,
        naturalSize?.height ?? 0,
        maxWidth,
        maxHeight,
      ),
    [naturalSize, maxWidth, maxHeight],
  );

  const html = useMemo(
    () =>
      buildVideoHtml(mediaUrl, {
        posterUrl: imageUrl,
        autoplay: true,
        loop: true,
        muted: true,
      }),
    [mediaUrl, imageUrl],
  );

  const openPage = () => {
    if (!pageUrl) return;
    Linking.openURL(pageUrl).catch(() => undefined);
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          width: displaySize.width,
          height: displaySize.height,
        },
      ]}
    >
      <View
        style={[
          styles.mediaFrame,
          {
            width: displaySize.width,
            height: displaySize.height,
          },
        ]}
      >
        {isVideo ? (
          <WebView
            source={{ html }}
            style={styles.media}
            scrollEnabled={false}
            javaScriptEnabled
            injectedJavaScript={VIDEO_SIZE_SCRIPT}
            onMessage={handleVideoMessage}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={["*"]}
            backgroundColor="transparent"
            containerStyle={styles.media}
          />
        ) : (
          <Pressable
            onPress={openPage}
            disabled={!pageUrl}
            style={styles.media}
          >
            <ExpoImage
              source={{ uri: imageUrl || mediaUrl }}
              style={styles.media}
              contentFit="cover"
              recyclingKey={cacheKey}
            />
          </Pressable>
        )}
      </View>

      <IconButton
        padding={6}
        color="neutral"
        variant="plain"
        onPress={onToggleFavorite}
        accessibilityLabel={
          isFavorited ? t("favorites.remove") : t("favorites.add")
        }
        style={styles.favoriteBtn}
      >
        <StarIcon
          size={14}
          color={isFavorited ? theme.colors.warning : "#fff"}
          weight={isFavorited ? "fill" : "regular"}
        />
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  mediaFrame: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  media: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  favoriteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    borderWidth: 0,
  },
});
