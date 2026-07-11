import type { UserProfile } from "@stores/objects/UserProfile";
import type {
  MobileProfileMusicBlock,
  ProfileBlockSize,
} from "@mutualzz/types";
import { Stack, Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledProfileMusicSizes } from "@utils/accessibilityLayout";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { Image } from "expo-image";
import { MusicNotesIcon, PauseIcon, PlayIcon } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";
import WebView from "react-native-webview";

interface Props {
  block: MobileProfileMusicBlock;
  size: ProfileBlockSize;
  profile: UserProfile;
}

function extractYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be")
      return u.pathname.slice(1).split("?")[0] || null;
  } catch {
    /* not a URL */
  }
  return null;
}

export function ProfileMusicWidgetView({ block, size, profile }: Props) {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();
  const musicSizes = useScaledProfileMusicSizes();

  const audioHash = block.audioHash ?? null;
  const title = audioHash
    ? (block.title ?? t("profile.blocks.music"))
    : (block.track?.name ?? block.title ?? t("profile.blocks.music"));
  const artists = audioHash
    ? (block.artists ?? null)
    : (block.track?.artists ?? block.artists ?? null);
  const image = audioHash
    ? (block.image ?? null)
    : (block.track?.image ?? block.image ?? null);

  // Playback priority: uploaded audio > 30s preview > YouTube (matches desktop)
  const audioSrc = audioHash
    ? profile.constructProfileMusicAudioUrl(audioHash)
    : (block.track?.previewUrl ?? block.previewUrl ?? null);
  const youtubeVideoId = block.youtubeUrl
    ? extractYoutubeVideoId(block.youtubeUrl)
    : null;
  const playbackMode: "audio" | "youtube" | null = audioSrc
    ? "audio"
    : youtubeVideoId
      ? "youtube"
      : null;

  const sourceBadge = audioHash
    ? t("profile.music.fullSong")
    : youtubeVideoId && !audioSrc
      ? t("profile.music.youtube")
      : audioSrc
        ? t("profile.music.preview30s")
        : null;

  const [loadAudio, setLoadAudio] = useState(false);
  const [youtubeActive, setYoutubeActive] = useState(false);
  const playWhenReadyRef = useRef(false);

  const player = useAudioPlayer(loadAudio && audioSrc ? audioSrc : null, {
    downloadFirst: true,
  });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoadAudio(false);
    setYoutubeActive(false);
    playWhenReadyRef.current = false;
  }, [audioSrc, youtubeVideoId]);

  useEffect(() => {
    if (!playWhenReadyRef.current) return;
    if (!status.isLoaded || status.error) return;
    playWhenReadyRef.current = false;
    player.play();
  }, [status.isLoaded, status.error, player]);

  const isPlaying = playbackMode === "youtube" ? youtubeActive : status.playing;
  const isLoadingAudio =
    playbackMode === "audio" && loadAudio && !status.isLoaded && !status.error;

  const togglePlay = () => {
    if (playbackMode === "youtube") {
      setYoutubeActive((prev) => !prev);
      return;
    }
    if (!audioSrc) return;

    if (status.playing) {
      player.pause();
      return;
    }

    if (!loadAudio) {
      playWhenReadyRef.current = true;
      setLoadAudio(true);
      return;
    }

    if (status.error) {
      playWhenReadyRef.current = true;
      player.replace(audioSrc);
      return;
    }

    if (!status.isLoaded) {
      playWhenReadyRef.current = true;
      return;
    }

    if (status.didJustFinish) player.seekTo(0);
    player.play();
  };

  const PlaybackIcon = ({ playSize }: { playSize: number }) => {
    if (isLoadingAudio) return <ActivityIndicator size="small" color="#fff" />;
    return isPlaying ? (
      <PauseIcon size={playSize} color="#fff" weight="fill" />
    ) : (
      <PlayIcon size={playSize} color="#fff" weight="fill" />
    );
  };

  const art = (
    <View
      style={{
        width: size === "s" ? "100%" : musicSizes.art,
        height: size === "s" ? "100%" : musicSizes.art,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: theme.colors.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={image}
        />
      ) : (
        <MusicNotesIcon
          size={musicSizes.miniPlayButton}
          color={theme.typography.colors.muted}
        />
      )}
    </View>
  );

  const youtubePlayer =
    playbackMode === "youtube" && youtubeActive && youtubeVideoId ? (
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          overflow: "hidden",
        }}
      >
        <WebView
          source={{
            uri: `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&playsinline=1`,
          }}
          style={{ width: 320, height: 180 }}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    ) : null;

  if (size === "s") {
    return (
      <Pressable
        disabled={!playbackMode}
        onPress={togglePlay}
        style={{ width: "100%", height: "100%", position: "relative" }}
      >
        {art}
        {youtubePlayer}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "55%",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 8,
            paddingVertical: 6,
            gap: 2,
          }}
        >
          <Typography
            level="body-xs"
            weight="bold"
            truncate="single"
            style={{
              color: "#fff",
              textShadowColor: "rgba(0,0,0,0.75)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {title}
          </Typography>
          {artists ? (
            <Typography
              level="body-xs"
              truncate="single"
              style={{
                color: "rgba(255,255,255,0.9)",
                textShadowColor: "rgba(0,0,0,0.75)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {artists}
            </Typography>
          ) : null}
        </View>
        {playbackMode ? (
          <View
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: musicSizes.miniPlayButton,
              height: musicSizes.miniPlayButton,
              borderRadius: musicSizes.miniPlayButton / 2,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.primary,
            }}
          >
            <PlaybackIcon playSize={musicSizes.miniPlayIcon} />
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      style={{
        width: "100%",
        height: "100%",
        gap: size === "m" ? 8 : 10,
        padding: size === "m" ? 10 : 12,
        position: "relative",
      }}
    >
      {art}
      {youtubePlayer}
      <Stack direction="column" style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography level="body-sm" weight="bold" truncate="double">
          {title}
        </Typography>
        {artists && (
          <Typography level="body-xs" textColor="accent" truncate="single">
            {artists}
          </Typography>
        )}
        {size === "l" && sourceBadge && (
          <Typography level="body-xs" textColor="muted">
            {sourceBadge}
          </Typography>
        )}
      </Stack>
      {playbackMode && (
        <Pressable
          onPress={togglePlay}
          style={{
            width: musicSizes.playButton,
            height: musicSizes.playButton,
            borderRadius: musicSizes.playButton / 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.primary,
          }}
        >
          <PlaybackIcon playSize={musicSizes.playIcon} />
        </Pressable>
      )}
    </Stack>
  );
}
