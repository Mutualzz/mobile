import { IconButton } from "@components/IconButton";
import { BottomSheet } from "@components/Keyboard/BottomSheet";
import { useDebouncedEffect } from "@hooks/useDebouncedEffect";
import { useAppStore } from "@hooks/useStores";
import type { APIProfileMusicSearchTrack } from "@mutualzz/types";
import { Box, Input, Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledProfileMusicSizes } from "@utils/accessibilityLayout";
import { MusicNotesIcon, XIcon } from "phosphor-react-native";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (track: APIProfileMusicSearchTrack) => void;
}

export function ProfileWidgetMusicPicker({ visible, onClose, onSelect }: Props) {
  const app = useAppStore();
  const { theme } = useTheme();
  const musicSizes = useScaledProfileMusicSizes();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<APIProfileMusicSearchTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDebouncedEffect(
    () => {
      const q = query.trim();
      if (!q) {
        setResults([]);
        setError(null);
        return;
      }

      let cancelled = false;
      setLoading(true);
      setError(null);

      app.profiles
        .searchMusic(q)
        .then((res) => {
          if (cancelled) return;
          setResults(res.tracks);
        })
        .catch(() => {
          if (cancelled) return;
          setError("Search failed");
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    },
    [query],
    350,
  );

  return (
    <BottomSheet
      open={visible}
      onClose={onClose}
      title="Search for a song"
      maxHeight="80%"
      scrollable
      headerRight={
        <IconButton
          variant="plain"
          color="neutral"
          padding={4}
          accessibilityLabel="Close"
          onPress={onClose}
        >
          <XIcon size={18} />
        </IconButton>
      }
    >
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Song or artist name"
        autoFocus
      />

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : error ? (
        <Typography level="body-sm" color="danger">
          {error}
        </Typography>
      ) : results.length === 0 && query.trim() ? (
        <Typography level="body-sm" textColor="muted">
          No results
        </Typography>
      ) : (
        results.map((track) => (
          <Pressable
            key={`${track.source}-${track.id}`}
            onPress={() => onSelect(track)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 8,
              borderRadius: 10,
              backgroundColor: theme.colors.surface,
            }}
          >
            <View
              style={{
                width: musicSizes.trackArt,
                height: musicSizes.trackArt,
                borderRadius: 8,
                overflow: "hidden",
                backgroundColor: theme.colors.background,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {track.image ? (
                <Image
                  source={{ uri: track.image }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={track.image}
                />
              ) : (
                <MusicNotesIcon
                  size={18}
                  color={theme.typography.colors.muted}
                />
              )}
            </View>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Typography level="body-sm" weight="bold" truncate="single">
                {track.name}
              </Typography>
              <Typography level="body-xs" textColor="muted" truncate="single">
                {track.artists}
              </Typography>
            </Box>
          </Pressable>
        ))
      )}
    </BottomSheet>
  );
}
