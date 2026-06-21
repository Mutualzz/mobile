import { IconButton } from "@components/IconButton";
import { useAppStore } from "@hooks/useStores";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  StarIcon,
  XIcon,
} from "phosphor-react-native";
import { Box, Input, Typography, useTheme } from "@mutualzz/ui-native";
import type { GifResult, GifsResponse, GifTagsResponse } from "@utils/gifs";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";

interface GifPickerContentProps {
  active?: boolean;
  onSelectGif: (gif: GifResult) => void;
}

const LIST_HORIZONTAL_PADDING = 8;
const TILE_GAP = 4;

const GifTile = ({
  gif,
  tileWidth,
  isFavorited,
  onSelect,
  onToggleFavorite,
}: {
  gif: GifResult;
  tileWidth: number;
  isFavorited: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) => {
  const { theme } = useTheme();
  const preview = gif.preview || gif.url;

  return (
    <View
      style={{
        width: tileWidth,
        padding: TILE_GAP / 2,
      }}
    >
      <View
        style={{
          width: tileWidth - TILE_GAP,
          aspectRatio: 1,
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: `${theme.colors.neutral}18`,
        }}
      >
        <Pressable onPress={onSelect} style={{ width: "100%", height: "100%" }}>
          <Image
            source={{ uri: preview }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </Pressable>

        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 1,
            width: 24,
            height: 24,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        >
          <StarIcon
            size={14}
            color={isFavorited ? "#f5c542" : "#fff"}
            weight={isFavorited ? "fill" : "regular"}
          />
        </Pressable>
      </View>
    </View>
  );
};

export const GifPickerContent = observer(
  ({ active = true, onSelectGif }: GifPickerContentProps) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [viewingFavorites, setViewingFavorites] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const favoriteGifs = app.settings?.favoriteGifs ?? [];

    const tileWidth = useMemo(
      () => (windowWidth - LIST_HORIZONTAL_PADDING * 2 - TILE_GAP) / 2,
      [windowWidth],
    );

    useEffect(() => {
      if (active) return;
      setSearch("");
      setDebouncedSearch("");
      setViewingFavorites(false);
    }, [active]);

    useEffect(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
      if (search) setViewingFavorites(false);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, [search]);

    const { data: tagsData } = useQuery({
      queryKey: ["gifs", "tags"],
      queryFn: () => app.rest.get<GifTagsResponse>("/gifs/tags"),
      staleTime: Infinity,
      enabled: active,
    });

    const { data, fetchNextPage, hasNextPage, isLoading, isFetching } =
      useInfiniteQuery({
        queryKey: ["gifs", "search", debouncedSearch],
        queryFn: ({ pageParam }) =>
          app.rest.get<GifsResponse>("/gifs/search", {
            q: debouncedSearch.trim(),
            ...(pageParam ? { next: pageParam } : {}),
          }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.next ?? undefined,
        staleTime: 1000 * 60 * 5,
        enabled: active && !!debouncedSearch.trim(),
      });

    const searchResults = useMemo(
      () => data?.pages.flatMap((page) => page.results) ?? [],
      [data?.pages],
    );

    const favoriteItems = useMemo(
      () =>
        favoriteGifs.map((entry) => {
          const [klipyUrl, previewUrl] = entry.split("|");
          const slug = klipyUrl.split("/").pop() ?? "";
          return {
            id: slug,
            slug,
            title: "",
            url: klipyUrl,
            preview: previewUrl ?? "",
            width: 0,
            height: 0,
          } satisfies GifResult;
        }),
      [favoriteGifs],
    );

    const listData = viewingFavorites
      ? favoriteItems
      : debouncedSearch.trim()
        ? searchResults
        : [];

    const showTags =
      !debouncedSearch.trim() && !viewingFavorites && !!tagsData?.tags?.length;

    const handleToggleFavorite = (gif: GifResult) => {
      const entry = gif.preview ? `${gif.url}|${gif.preview}` : gif.url;
      app.settings?.toggleFavoriteGif(entry);
    };

    const listHeader = (
      <View>
        {showTags ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 12,
              paddingBottom: 8,
            }}
          >
            {favoriteGifs.length > 0 ? (
              <Pressable
                onPress={() => setViewingFavorites(true)}
                style={{
                  width: "48%",
                  height: 96,
                  margin: "1%",
                  borderRadius: 8,
                  overflow: "hidden",
                  backgroundColor: `${theme.colors.neutral}22`,
                }}
              >
                {favoriteGifs[0] ? (
                  <Image
                    source={{
                      uri: favoriteGifs[0].split("|")[1] ?? "",
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    resizeMode="cover"
                  />
                ) : null}
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography level="body-sm" weight="bold">
                    Favorites
                  </Typography>
                </View>
              </Pressable>
            ) : null}
            {tagsData?.tags.map((tag) => (
              <Pressable
                key={tag.name}
                onPress={() => setSearch(tag.name)}
                style={{
                  width: "48%",
                  height: 96,
                  margin: "1%",
                  borderRadius: 8,
                  overflow: "hidden",
                  backgroundColor: `${theme.colors.neutral}22`,
                }}
              >
                <Image
                  source={{ uri: tag.preview }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    level="body-sm"
                    weight="bold"
                    style={{ textTransform: "capitalize" }}
                  >
                    {tag.name}
                  </Typography>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {viewingFavorites ? (
          <Typography
            level="label-xs"
            textColor="muted"
            style={{
              paddingHorizontal: 16,
              paddingBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Favorites
          </Typography>
        ) : null}

        {(isLoading || isFetching) && debouncedSearch.trim() ? (
          <ActivityIndicator
            style={{ paddingVertical: 24 }}
            color={theme.colors.primary}
          />
        ) : null}

        {debouncedSearch.trim() &&
        !viewingFavorites &&
        !isLoading &&
        listData.length === 0 ? (
          <Typography
            level="body-sm"
            textColor="muted"
            style={{ textAlign: "center", padding: 32 }}
          >
            No GIFs found for &quot;{debouncedSearch}&quot;
          </Typography>
        ) : null}
      </View>
    );

    return (
      <View style={{ flex: 1 }}>
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingBottom: 8,
            gap: 8,
          }}
        >
          {(search || viewingFavorites) && (
            <IconButton
              padding={6}
              color="neutral"
              onPress={() => {
                setSearch("");
                setViewingFavorites(false);
              }}
            >
              <ArrowLeftIcon size={18} />
            </IconButton>
          )}
          <Box style={{ flex: 1 }}>
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search Klipy…"
              fullWidth
              startDecorator={
                <MagnifyingGlassIcon
                  size={16}
                  color={theme.typography.colors.muted}
                />
              }
              endDecorator={
                search ? (
                  <IconButton
                    padding={4}
                    color="neutral"
                    onPress={() => setSearch("")}
                  >
                    <XIcon size={14} />
                  </IconButton>
                ) : undefined
              }
            />
          </Box>
        </Box>

        <FlashList
          style={{ flex: 1 }}
          data={listData}
          keyExtractor={(item) => item.id || item.url}
          numColumns={2}
          // estimatedItemSize={tileWidth}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          drawDistance={360}
          contentContainerStyle={{
            paddingHorizontal: LIST_HORIZONTAL_PADDING - TILE_GAP / 2,
            paddingBottom: 16,
          }}
          ListHeaderComponent={listHeader}
          onEndReached={() => {
            if (!viewingFavorites && hasNextPage) {
              void fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            !viewingFavorites && hasNextPage ? (
              <ActivityIndicator
                style={{ paddingVertical: 16 }}
                color={theme.colors.primary}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <GifTile
              gif={item}
              tileWidth={tileWidth}
              isFavorited={
                viewingFavorites ||
                favoriteGifs.some((f) =>
                  f.startsWith(`https://klipy.com/gifs/${item.slug}`),
                )
              }
              onSelect={() => onSelectGif(item)}
              onToggleFavorite={() => handleToggleFavorite(item)}
            />
          )}
        />
      </View>
    );
  },
);
