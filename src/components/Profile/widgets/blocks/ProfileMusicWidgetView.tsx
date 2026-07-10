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
import { MusicNotesIcon, PauseIcon, PlayIcon } from "phosphor-react-native";
import { useEffect } from "react";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, View } from "react-native";

interface Props {
  block: MobileProfileMusicBlock;
  size: ProfileBlockSize;
  profile: UserProfile;
}

export function ProfileMusicWidgetView({ block, size, profile }: Props) {
  const { theme } = useTheme();
  const musicSizes = useScaledProfileMusicSizes();

  const audioHash = block.audioHash ?? null;
  const title = audioHash
    ? (block.title ?? "Music")
    : (block.track?.name ?? block.title ?? "Music");
  const artists = audioHash
    ? (block.artists ?? null)
    : (block.track?.artists ?? block.artists ?? null);
  const image = audioHash
    ? (block.image ?? null)
    : (block.track?.image ?? block.image ?? null);
  const sourceBadge = audioHash
    ? "Full song"
    : block.youtubeUrl
      ? "YouTube"
      : block.previewUrl
        ? "Preview"
        : null;

  const playableUrl = audioHash
    ? profile.constructProfileMusicAudioUrl(audioHash)
    : (block.previewUrl ?? null);

  const player = useAudioPlayer(playableUrl ?? undefined);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, []);

  const ready = status.isLoaded;

  const togglePlay = () => {
    if (!ready) return;
    if (status.playing) player.pause();
    else {
      // Restart from the top once a preview/track has finished.
      if (status.didJustFinish) player.seekTo(0);
      player.play();
    }
  };

  const PlaybackIcon = ({ playSize }: { playSize: number }) => {
    if (!ready) return <ActivityIndicator size="small" color="#fff" />;
    return status.playing ? (
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

  if (size === "s") {
    return (
      <Pressable
        disabled={!playableUrl}
        onPress={togglePlay}
        style={{ width: "100%", height: "100%", position: "relative" }}
      >
        {art}
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
        {playableUrl ? (
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
      }}
    >
      {art}
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
      {playableUrl && (
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
