import { Button } from "@components/Button";
import { ExpressionPickerSheet } from "@components/Expression/ExpressionPickerSheet";
import { IconButton } from "@components/IconButton";
import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { Paper } from "@components/Paper";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { PickedPostAsset } from "@stores/Post.store";
import type { Expression } from "@stores/objects/Expression";
import type { GifResult } from "@utils/gifs";
import { resolveGifSendUrl } from "@utils/gifs";
import { useScaledFeedPreviewSizes } from "@utils/accessibilityLayout";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useMutation } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import {
  CalendarIcon,
  CalendarPlusIcon,
  FileIcon,
  ImageIcon,
  SmileyIcon,
  XIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Image, Platform, Pressable, ScrollView } from "react-native";

interface Props {
  onPosted?: () => void;
}

const MAX_STICKERS = 3;
const MAX_FILES = 10;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PostComposer = observer(({ onPosted }: Props) => {
  const feedSizes = useScaledFeedPreviewSizes();
  const app = useAppStore();
  const { theme } = useTheme();
  const { navigate } = useAppNavigation();
  const [content, setContent] = useState("");
  const [assets, setAssets] = useState<PickedPostAsset[]>([]);
  const [stickers, setStickers] = useState<Expression[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      app.posts.createPost(
        content.trim(),
        assets.length > 0 ? assets : undefined,
        scheduledFor ?? undefined,
        stickers.length > 0 ? stickers.map((s) => s.id) : undefined,
      ),
    onSuccess: () => {
      setContent("");
      setAssets([]);
      setStickers([]);
      setScheduledFor(null);
      setShowScheduler(false);
      onPosted?.();
    },
  });

  const pickMedia = async () => {
    if (assets.length >= MAX_FILES) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (result.canceled) return;

    const next = result.assets
      .filter((asset) => (asset.fileSize ?? 0) <= MAX_FILE_SIZE)
      .map((asset) => ({
        uri: asset.uri,
        type:
          asset.mimeType ??
          (asset.type === "video" ? "video/mp4" : "image/jpeg"),
        name:
          asset.fileName ??
          `attachment.${asset.type === "video" ? "mp4" : "jpg"}`,
      }));

    setAssets((prev) => [...prev, ...next].slice(0, MAX_FILES));
  };

  const removeAsset = (index: number) => {
    setAssets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectSticker = (sticker: Expression) => {
    setStickers((prev) => {
      if (prev.some((s) => s.id === sticker.id)) return prev;
      if (prev.length >= MAX_STICKERS) return prev;
      return [...prev, sticker];
    });
    setPickerOpen(false);
  };

  const handleGif = (gif: GifResult) => {
    const url = resolveGifSendUrl(gif);
    const needsSpace = content.length > 0 && !/\s$/.test(content);
    setContent((prev) => `${prev}${needsSpace ? " " : ""}${url}`);
    setPickerOpen(false);
  };

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setScheduledFor(date);
  };

  const canSubmit =
    (content.trim().length > 0 || assets.length > 0 || stickers.length > 0) &&
    (!scheduledFor || scheduledFor.getTime() > Date.now());

  return (
    <Paper
      style={{
        padding: 12,
        borderRadius: 12,
        gap: 12,
      }}
      elevation={app.settings?.preferEmbossed ? 3 : 1}
    >
      {stickers.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Box style={{ flexDirection: "row", gap: 8 }}>
            {stickers.map((sticker) => (
              <Box key={sticker.id} style={{ position: "relative" }}>
                <Image
                  source={{ uri: sticker.url }}
                  style={{ width: feedSizes.sticker, height: feedSizes.sticker }}
                  resizeMode="contain"
                />
                <IconButton
                  variant="plain"
                  padding={2}
                  onPress={() =>
                    setStickers((prev) =>
                      prev.filter((s) => s.id !== sticker.id),
                    )
                  }
                  style={{ position: "absolute", top: -4, right: -4 }}
                >
                  <XIcon size={14} />
                </IconButton>
              </Box>
            ))}
          </Box>
        </ScrollView>
      )}

      <Box style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <UserAvatar user={app.account} size="md" />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <MarkdownInput
            value={content}
            onChange={setContent}
            selection={selection}
            onChangeSelection={setSelection}
            placeholder="What's on your mind?"
            style={{ minHeight: feedSizes.composerMinHeight }}
          />
        </Box>
      </Box>

      {assets.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Box style={{ flexDirection: "row", gap: 10 }}>
            {assets.map((asset, index) => {
              const isImage = asset.type.startsWith("image/");

              return (
                <Box key={`${asset.name}-${index}`} style={{ position: "relative" }}>
                  {isImage ? (
                    <Image
                      source={{ uri: asset.uri }}
                      style={{ width: feedSizes.asset, height: feedSizes.asset, borderRadius: 8 }}
                    />
                  ) : (
                    <Paper
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        padding: 8,
                        borderRadius: 8,
                        maxWidth: feedSizes.assetMaxWidth,
                      }}
                      elevation={1}
                    >
                      <FileIcon size={16} color={theme.colors.info} />
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Typography level="body-xs" truncate="single">
                          {asset.name}
                        </Typography>
                      </Box>
                    </Paper>
                  )}
                  <IconButton
                    variant="solid"
                    color="danger"
                    padding={2}
                    onPress={() => removeAsset(index)}
                    style={{ position: "absolute", top: -4, right: -4 }}
                  >
                    <XIcon size={10} />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        </ScrollView>
      )}

      {showScheduler && (
        <Box style={{ gap: 8 }}>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={{
              padding: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: `${theme.typography.colors.muted}40`,
            }}
          >
            <Typography level="body-sm">
              {scheduledFor
                ? scheduledFor.toLocaleString()
                : "Pick date and time"}
            </Typography>
          </Pressable>
          {scheduledFor && (
            <Button
              variant="plain"
              size="sm"
              onPress={() => setScheduledFor(null)}
            >
              Clear schedule
            </Button>
          )}
          {showDatePicker && (
            <DateTimePicker
              value={scheduledFor ?? new Date(Date.now() + 60 * 60_000)}
              mode="datetime"
              minimumDate={new Date()}
              onChange={onDateChange}
            />
          )}
        </Box>
      )}

      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box style={{ flexDirection: "row", gap: 4 }}>
          <IconButton
            variant="plain"
            padding={6}
            disabled={assets.length >= MAX_FILES}
            onPress={() => void pickMedia()}
            accessibilityLabel="Add media"
          >
            <ImageIcon size={22} />
          </IconButton>
          <IconButton
            variant="plain"
            padding={6}
            onPress={() => setPickerOpen(true)}
            accessibilityLabel="Add emoji or sticker"
          >
            <SmileyIcon size={22} />
          </IconButton>
          <IconButton
            variant="plain"
            padding={6}
            onPress={() => setShowScheduler((prev) => !prev)}
            accessibilityLabel="Schedule post"
          >
            <CalendarPlusIcon
              size={22}
              weight={showScheduler ? "fill" : "regular"}
            />
          </IconButton>
          <IconButton
            variant="plain"
            padding={6}
            onPress={() => navigate("/(tabs)/feed/scheduled")}
            accessibilityLabel="View scheduled posts"
          >
            <CalendarIcon size={22} />
          </IconButton>
        </Box>

        <Button
          disabled={!canSubmit || isPending}
          color="success"
          size="sm"
          onPress={() => submit()}
        >
          {scheduledFor ? "Schedule" : "Post"}
        </Button>
      </Box>

      <ExpressionPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initialTab="stickers"
        onSelectEmoji={() => setPickerOpen(false)}
        onSelectCustomEmoji={() => setPickerOpen(false)}
        onSelectSticker={handleSelectSticker}
        onSelectGif={handleGif}
        showStickers
      />
    </Paper>
  );
});
