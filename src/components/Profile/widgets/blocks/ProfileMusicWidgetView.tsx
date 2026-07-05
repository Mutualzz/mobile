import type { UserProfile } from "@stores/objects/UserProfile";
import type { MobileProfileMusicBlock, ProfileBlockSize } from "@mutualzz/types";
import { Stack, Typography, useTheme } from "@mutualzz/ui-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { MusicNotesIcon, PauseIcon, PlayIcon } from "phosphor-react-native";
import { Image, Pressable, View } from "react-native";

interface Props {
  block: MobileProfileMusicBlock;
  size: ProfileBlockSize;
  profile: UserProfile;
}

export function ProfileMusicWidgetView({ block, size, profile }: Props) {
  const { theme } = useTheme();

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

  // YouTube links aren't embeddable playback on mobile (no iframe), so only
  // an uploaded MP3 or a resolved preview URL are actually playable here.
  const playableUrl = audioHash
    ? profile.constructProfileMusicAudioUrl(audioHash)
    : (block.previewUrl ?? null);

  const player = useAudioPlayer(playableUrl ?? undefined);
  const status = useAudioPlayerStatus(player);

  const togglePlay = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  const art = (
    <View
      style={{
        width: size === "s" ? "100%" : 52,
        height: size === "s" ? "100%" : 52,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: theme.colors.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {image ? (
        <Image source={{ uri: image }} style={{ width: "100%", height: "100%" }} />
      ) : (
        <MusicNotesIcon size={22} color={theme.typography.colors.muted} />
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
              width: 22,
              height: 22,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.primary,
            }}
          >
            {status.playing ? (
              <PauseIcon size={11} color="#fff" weight="fill" />
            ) : (
              <PlayIcon size={11} color="#fff" weight="fill" />
            )}
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      p={1.25}
      style={{ width: "100%", height: "100%" }}
    >
      {art}
      <Stack direction="column" style={{ flex: 1, minWidth: 0 }}>
        <Typography level="body-sm" weight="bold" numberOfLines={2}>
          {title}
        </Typography>
        {artists ? (
          <Typography level="body-xs" textColor="accent" numberOfLines={1}>
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
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.primary,
          }}
        >
          {status.playing ? (
            <PauseIcon size={16} color="#fff" weight="fill" />
          ) : (
            <PlayIcon size={16} color="#fff" weight="fill" />
          )}
        </Pressable>
      ) : null}
    </Stack>
  );
}
