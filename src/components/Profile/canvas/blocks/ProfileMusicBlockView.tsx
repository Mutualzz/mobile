import type { ProfileMusicBlock } from "@mutualzz/types";
import { Paper, Stack, Typography, useTheme } from "@mutualzz/ui-native";
import { MusicNotesIcon } from "phosphor-react-native";
import { Image, View } from "react-native";

interface Props {
  block: ProfileMusicBlock;
}

export function ProfileMusicBlockView({ block }: Props) {
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

  return (
    <Paper
      elevation={image ? 0 : 1}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 12,
        padding: 10,
        overflow: "hidden",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <View
          style={{
            width: 52,
            height: 52,
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
            <MusicNotesIcon size={22} color={theme.typography.colors.muted} />
          )}
        </View>

        <Stack direction="column" style={{ flex: 1, minWidth: 0 }}>
          <Typography level="body-sm" weight="bold" numberOfLines={2}>
            {title}
          </Typography>
          {artists ? (
            <Typography level="body-xs" textColor="accent" numberOfLines={1}>
              {artists}
            </Typography>
          ) : null}
          {sourceBadge ? (
            <Typography level="body-xs" textColor="muted">
              {sourceBadge}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}
