import { IconButton } from "@components/IconButton";
import { BottomSheet } from "@components/Keyboard/BottomSheet";
import { useDebouncedEffect } from "@hooks/useDebouncedEffect";
import { useAppStore } from "@hooks/useStores";
import type { APIProfileMusicSearchTrack } from "@mutualzz/types";
import { Box, Input, Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledProfileMusicSizes } from "@utils/accessibilityLayout";
import { MusicNotesIcon, XIcon } from "phosphor-react-native";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (track: APIProfileMusicSearchTrack) => void;
  /** Use overlay when already inside another modal/sheet. */
  presentation?: "modal" | "overlay";
}

function MusicSearchResults({
  loading,
  error,
  query,
  results,
  onSelect}: {
  loading: boolean;
  error: string | null;
  query: string;
  results: APIProfileMusicSearchTrack[];
  onSelect: (track: APIProfileMusicSearchTrack) => void;
}) {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();
  const musicSizes = useScaledProfileMusicSizes();

  if (loading) {
    return <ActivityIndicator color={theme.colors.primary} />;
  }

  if (error) {
    return (
      <Typography level="body-sm" color="danger">
        {error}
      </Typography>
    );
  }

  if (results.length === 0 && query.trim()) {
    return (
      <Typography level="body-sm" textColor="muted">
        {t("profile.blocks.noResults")}
      </Typography>
    );
  }

  return (
    <>
      {results.map((track) => (
        <Pressable
          key={`${track.source}-${track.id}`}
          onPress={() => onSelect(track)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            padding: 8,
            borderRadius: 10,
            backgroundColor: theme.colors.surface}}
        >
          <View
            style={{
              width: musicSizes.trackArt,
              height: musicSizes.trackArt,
              borderRadius: 8,
              overflow: "hidden",
              backgroundColor: theme.colors.background,
              alignItems: "center",
              justifyContent: "center"}}
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
      ))}
    </>
  );
}

export function ProfileWidgetMusicPicker({
  visible,
  onClose,
  onSelect,
  presentation = "modal"}: Props) {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const app = useAppStore();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<APIProfileMusicSearchTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const title = t("profile.editor.searchForSong");

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setError(null);
      setLoading(false);
    }
  }, [visible]);

  useDebouncedEffect(
    () => {
      if (!visible) return;

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
          setError(t("profile.inspector.searchFailed"));
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    },
    [query, visible],
    350,
  );

  if (presentation === "overlay") {
    if (!visible) return null;

    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            zIndex: 200,
            backgroundColor: theme.colors.background,
            paddingTop: insets.top},
        ]}
      >
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 10}}
        >
          <Typography level="title-md" weight="bold">
            {title}
          </Typography>
          <IconButton
            variant="plain"
            color="neutral"
            padding={4}
            accessibilityLabel={tCommon("close")}
            onPress={onClose}
          >
            <XIcon size={18} />
          </IconButton>
        </Box>

        <Box style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={t("profile.inspector.songOrArtist")}
            autoFocus
            autoCorrect={false}
          />
        </Box>

        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8}}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MusicSearchResults
            loading={loading}
            error={error}
            query={query}
            results={results}
            onSelect={onSelect}
          />
        </KeyboardAwareScrollView>
      </View>
    );
  }

  return (
    <BottomSheet
      open={visible}
      onClose={onClose}
      title={title}
      maxHeight="80%"
      headerRight={
        <IconButton
          variant="plain"
          color="neutral"
          padding={4}
          accessibilityLabel={tCommon("close")}
          onPress={onClose}
        >
          <XIcon size={18} />
        </IconButton>
      }
    >
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={t("profile.inspector.songOrArtist")}
        autoFocus
        autoCorrect={false}
      />

      <MusicSearchResults
        loading={loading}
        error={error}
        query={query}
        results={results}
        onSelect={onSelect}
      />
    </BottomSheet>
  );
}
