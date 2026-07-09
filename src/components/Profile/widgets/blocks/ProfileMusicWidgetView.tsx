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
import { ActivityIndicator, Image, Pressable, View } from "react-native";

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
        />
      ) : (
        <MusicNotesIcon size={musicSizes.miniPlayButton} color={theme.typography.colors.muted} />
      )}
    </View>
  );

  if (size === "s") {
    return (
      <Pressable
        disabled={!playableUrl}
        onPress={togglePlay}
        style={{ width: "100%", height: "100%" }}
      >
        {art}
        {playableUrl ? (
          <View
            style={{
              position: "absolute",
              bottom: 4,
              right: 4,
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
      style={{ width: "100%", height: "100%", gap: 10, padding: 12 }}
    >
      {art}
      <Stack direction="column" style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography level="body-sm" weight="bold" truncate="double">
          {title}
        </Typography>
        {artists ? (
          <Typography level="body-xs" textColor="accent" truncate="single">
            {artists}
          </Typography>
        ) : null}
        {size === "l" && sourceBadge ? (
          <Typography level="body-xs" textColor="muted">
            {sourceBadge}
          </Typography>
        ) : null}
      </Stack>
      {playableUrl ? (
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
      ) : null}
    </Stack>
  );
}
