import { IconButton } from "@components/IconButton";
import { useGifOnScreen } from "@hooks/useGifOnScreen";
import { useTheme } from "@mutualzz/ui-native";
import {
  computeContainedSize,
  getCommentGifMaxWidth,
  getMessageGifMaxWidth,
  MESSAGE_GIF_MAX_HEIGHT,
} from "@utils/gifs";
import { Image as ExpoImage } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { StarIcon } from "phosphor-react-native";
import { appStore } from "@hooks/useStores";
import { openExternalLink } from "@utils/openExternalLink";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

interface Props {
  mediaUrl: string;
  imageUrl?: string | null;
  pageUrl?: string | null;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  compact?: boolean;
  autoplay?: boolean;
}

interface NaturalSize { width: number; height: number }

const VIDEO_URL_PATTERN = /\.(mp4|webm)(\?|$)/i;

const naturalSizeCache = new Map<string, NaturalSize>();

function cacheKeyFor(mediaUrl: string, imageUrl?: string | null) {
  return imageUrl || mediaUrl;
}

function GifVideoPlayer({
  uri,
  width,
  height,
  playing,
}: {
  uri: string;
  width: number;
  height: number;
  playing: boolean;
}) {
  const player = useVideoPlayer({ uri, useCaching: true }, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    if (playing) {
      player.play();
      return;
    }

    player.pause();
  }, [player, uri, playing]);

  return (
    <VideoView
      player={player}
      style={{ width, height }}
      contentFit="contain"
      nativeControls={false}
      allowsPictureInPicture={false}
    />
  );
}

export function MessageGifEmbed({
  mediaUrl,
  imageUrl,
  pageUrl,
  isFavorited,
  onToggleFavorite,
  compact = false,
  autoplay = true,
}: Props) {
  const { t } = useTranslation("chat");
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const maxWidth = compact
    ? getCommentGifMaxWidth(windowWidth)
    : getMessageGifMaxWidth(windowWidth);
  const maxHeight = compact ? 220 : MESSAGE_GIF_MAX_HEIGHT;

  const isVideo = VIDEO_URL_PATTERN.test(mediaUrl);
  const posterUri = imageUrl && !VIDEO_URL_PATTERN.test(imageUrl) ? imageUrl : null;
  const sizingUri = imageUrl || (!isVideo ? mediaUrl : null);
  const cacheKey = cacheKeyFor(mediaUrl, imageUrl);

  const { ref, onLayout, onScreen } = useGifOnScreen(cacheKey);
  const [activated, setActivated] = useState(false);
  const [hovering, setHovering] = useState(false);
  const playing = autoplay || activated || hovering;

  const lockedRef = useRef(naturalSizeCache.has(cacheKey));
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(
    () => naturalSizeCache.get(cacheKey) ?? null,
  );

  const lockSize = useCallback(
    (width: number, height: number) => {
      if (lockedRef.current || !width || !height) return;
      lockedRef.current = true;
      const next = { width, height };
      naturalSizeCache.set(cacheKey, next);
      setNaturalSize(next);
    },
    [cacheKey],
  );

  useEffect(() => {
    lockedRef.current = naturalSizeCache.has(cacheKey);
    setNaturalSize(naturalSizeCache.get(cacheKey) ?? null);
    setActivated(false);
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
      () => null,
    );
    return () => {
      cancelled = true;
    };
  }, [sizingUri, lockSize]);

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

  const openPage = () => {
    if (!pageUrl) return;
    void openExternalLink(appStore, pageUrl);
  };

  return (
    <View
      ref={ref}
      collapsable={false}
      onLayout={onLayout}
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
          <Pressable
            onPress={() => setActivated(true)}
            onHoverIn={() => setHovering(true)}
            onHoverOut={() => setHovering(false)}
            style={styles.media}
          >
            {posterUri && (
              <ExpoImage
                source={{ uri: posterUri }}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
                recyclingKey={cacheKey}
                autoplay={false}
              />
            )}
            {onScreen && (playing || !posterUri) && (
              <GifVideoPlayer
                uri={mediaUrl}
                width={displaySize.width}
                height={displaySize.height}
                playing={playing}
              />
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={openPage}
            disabled={!pageUrl}
            style={styles.media}
          >
            <ExpoImage
              source={{ uri: imageUrl || mediaUrl }}
              style={styles.media}
              contentFit="contain"
              recyclingKey={cacheKey}
              autoplay={autoplay && onScreen}
            />
          </Pressable>
        )}
      </View>

      <IconButton
        padding={6}
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
  },
  media: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  favoriteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
  },
});
