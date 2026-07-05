import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { useDebouncedEffect } from "@hooks/useDebouncedEffect";
import { useAppStore } from "@hooks/useStores";
import type { APIProfileMusicSearchTrack } from "@mutualzz/types";
import { Box, Input, Typography, useTheme } from "@mutualzz/ui-native";
import { MusicNotesIcon, XIcon } from "phosphor-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.45)",
        }}
        onPress={onClose}
      >
        <Pressable onPress={() => undefined}>
          <Paper
            style={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              gap: 12,
              maxHeight: "80%",
            }}
            elevation={2}
          >
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography level="body-lg" weight="bold">
                Search for a song
              </Typography>
              <IconButton
                variant="plain"
                color="neutral"
                padding={4}
                accessibilityLabel="Close"
                onPress={onClose}
              >
                <XIcon size={18} />
              </IconButton>
            </Box>

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
            ) : (
              <ScrollView contentContainerStyle={{ gap: 6 }}>
                {results.length === 0 && query.trim() ? (
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
                          width: 44,
                          height: 44,
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
                          />
                        ) : (
                          <MusicNotesIcon
                            size={18}
                            color={theme.typography.colors.muted}
                          />
                        )}
                      </View>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Typography level="body-sm" weight="bold" numberOfLines={1}>
                          {track.name}
                        </Typography>
                        <Typography level="body-xs" textColor="muted" numberOfLines={1}>
                          {track.artists}
                        </Typography>
                      </Box>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            )}
          </Paper>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
