import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { ProfileMarkdownField } from "@components/Profile/shared/ProfileMarkdownField";
import {
  ProfileDrawCanvas,
  renderStrokesToSvg,
  type DrawCanvasState,
} from "@components/Profile/widgets/editor/ProfileDrawCanvas";
import { PROFILE_DRAW_CANVAS_SIZE } from "@components/Profile/widgets/editor/drawCanvas.constants";
import { parseDrawCanvasState } from "@components/Profile/widgets/editor/drawCanvas.utils";
import { ProfileWidgetGifPicker } from "@components/Profile/widgets/editor/ProfileWidgetGifPicker";
import { ProfileWidgetStickerPicker } from "@components/Profile/widgets/editor/ProfileWidgetStickerPicker";
import { ProfileWidgetMusicPicker } from "@components/Profile/widgets/editor/ProfileWidgetMusicPicker";
import { ProfileStickerWidgetView } from "@components/Profile/widgets/blocks/ProfileStickerWidgetView";
import { useAppStore } from "@hooks/useStores";
import type { UserProfile } from "@stores/objects/UserProfile";
import type { APIMobileProfileBlock, ProfileImageCrop, ProfileLinkItem, MobileProfileStickerBlock } from "@mutualzz/types";
import {
  Box,
  Input,
  Modal,
  Switch,
  Slider,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import { ProfileBlockCroppedImage } from "@components/Profile/shared/ProfileBlockImage";
import { ProfileBlockLoopingVideo } from "@components/Profile/shared/ProfileBlockLoopingVideo";
import { useScaledProfilePreviewHeight } from "@utils/accessibilityLayout";
import {
  canAdjustProfileImageCrop,
  pickProfileImageForUpload,
  recropProfileImageFromUrl,
} from "@utils/profileImagePicker";
import {
  clampProfileBlockCornerRadius,
  isCustomProfileBlockCornerRadius,
  isProfileImageCdnHash,
  isProfileImageVideoUrl,
  PROFILE_BLOCK_CORNER_RADIUS_MAX,
  PROFILE_BLOCK_CORNER_RADIUS_MIN,
  resolveProfileBlockCornerRadius,
  resolveProfileImageBlockUrl,
} from "@mutualzz/ui-core";
import * as DocumentPicker from "expo-document-picker";
import {
  ArrowLeftIcon,
  GifIcon,
  StickerIcon,
  CropIcon,
  PlusIcon,
  TrashIcon,
  UploadSimpleIcon,
} from "phosphor-react-native";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";

interface Props {
  visible: boolean;
  onClose: () => void;
  block: APIMobileProfileBlock | null;
  profile: UserProfile;
  onUpdate: (blockId: string, patch: Record<string, unknown>) => void;
  onDelete: (blockId: string) => void;
  /** Render as a fullscreen overlay instead of a nested RN Modal. */
  presentation?: "modal" | "overlay";
}

export function ProfileWidgetContentEditorSheet({
  visible,
  onClose,
  block,
  profile,
  onUpdate,
  onDelete,
  presentation = "modal",
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [drawMode, setDrawMode] = useState(false);
  const [musicPickerOpen, setMusicPickerOpen] = useState(false);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);

  useEffect(() => {
    if (!visible) {
      setDrawMode(false);
      setMusicPickerOpen(false);
      setGifPickerOpen(false);
      setStickerPickerOpen(false);
    }
  }, [visible]);

  useEffect(() => {
    setDrawMode(false);
    setMusicPickerOpen(false);
    setGifPickerOpen(false);
    setStickerPickerOpen(false);
  }, [block?.id]);

  if (!block) return null;

  const update = (patch: Record<string, unknown>) => onUpdate(block.id, patch);
  const isDrawBlock = block.type === "draw";
  const drawBlock = block.type === "draw" ? block : null;

  const handleDrawSave = (state: DrawCanvasState) => {
    update({
      paths: JSON.stringify({
        ...state,
        canvasSize: state.canvasSize ?? PROFILE_DRAW_CANVAS_SIZE,
      }),
      svgData: renderStrokesToSvg(state),
      backgroundColor: state.backgroundColor,
    });
    setDrawMode(false);
  };

  const sheetBody = (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: insets.top,
      }}
    >
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <IconButton
          padding={6}
          onPress={() => (drawMode ? setDrawMode(false) : onClose())}
          accessibilityLabel="Back"
        >
          <ArrowLeftIcon size={20} />
        </IconButton>
        <Typography level="title-md" weight="bold">
          {drawMode ? "Draw" : "Edit Widget"}
        </Typography>
      </Box>

      {isDrawBlock && drawMode && drawBlock ? (
        <Box
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <ProfileDrawCanvas
            key={`${drawBlock.id}-${drawBlock.paths ?? "new"}-${drawBlock.svgData ?? ""}`}
            initial={parseDrawCanvasState(
              drawBlock.paths,
              drawBlock.backgroundColor,
            )}
            onCancel={() => setDrawMode(false)}
            onSave={handleDrawSave}
          />
        </Box>
      ) : (
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            gap: 16,
            paddingBottom: insets.bottom + 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ProfileWidgetContentFields
            block={block}
            profile={profile}
            update={update}
            onStartDrawing={isDrawBlock ? () => setDrawMode(true) : undefined}
            onOpenMusicSearch={
              block.type === "music"
                ? () => setMusicPickerOpen(true)
                : undefined
            }
            onOpenGifPicker={
              block.type === "image" ? () => setGifPickerOpen(true) : undefined
            }
            onOpenStickerPicker={
              block.type === "sticker"
                ? () => setStickerPickerOpen(true)
                : undefined
            }
          />

          <ProfileBlockCornerRadiusFields block={block} update={update} />

          <Button
            variant="soft"
            color="danger"
            onPress={() => {
              onDelete(block.id);
              onClose();
            }}
          >
            Delete widget
          </Button>
        </KeyboardAwareScrollView>
      )}

      {block.type === "music" && (
        <ProfileWidgetMusicPicker
          presentation="overlay"
          visible={musicPickerOpen}
          onClose={() => setMusicPickerOpen(false)}
          onSelect={(track) => {
            update({
              track,
              previewUrl: track.previewUrl ?? null,
              trackUrl: track.trackUrl ?? null,
              audioHash: null,
              title: null,
              artists: null,
              image: null,
            });
            setMusicPickerOpen(false);
          }}
        />
      )}

      {block.type === "image" && (
        <ProfileWidgetGifPicker
          presentation="overlay"
          visible={gifPickerOpen}
          onClose={() => setGifPickerOpen(false)}
          onSelect={(src) => {
            update({ src, crop: null });
            setGifPickerOpen(false);
          }}
        />
      )}

      {block.type === "sticker" && (
        <ProfileWidgetStickerPicker
          presentation="overlay"
          visible={stickerPickerOpen}
          onClose={() => setStickerPickerOpen(false)}
          onSelect={(sticker) => {
            update({ expressionId: sticker.id });
            setStickerPickerOpen(false);
          }}
        />
      )}
    </View>
  );

  if (presentation === "overlay") {
    if (!visible) return null;

    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { zIndex: 100, backgroundColor: theme.colors.background },
        ]}
      >
        {sheetBody}
      </View>
    );
  }

  return (
    <Modal
      open={visible}
      onClose={onClose}
      layout="fullscreen"
      hideBackdrop
      showCloseButton={false}
      disableBackdropClick
      style={{ paddingVertical: 0 }}
    >
      {sheetBody}
    </Modal>
  );
}

function FieldSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Paper elevation={1} style={{ borderRadius: 12, padding: 14, gap: 10 }}>
      <Typography level="body-xs" weight={700} textColor="muted">
        {title.toUpperCase()}
      </Typography>
      {children}
    </Paper>
  );
}

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { theme } = useTheme();

  return (
    <Box style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: active
                ? theme.colors.primary
                : `${theme.typography.colors.muted}48`,
              backgroundColor: active
                ? `${theme.colors.primary}18`
                : "transparent",
            }}
          >
            <Typography
              level="body-xs"
              weight={active ? "bold" : undefined}
              style={{
                color: active
                  ? theme.colors.primary
                  : theme.typography.colors.muted,
              }}
            >
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </Box>
  );
}

function ProfileBlockCornerRadiusFields({
  block,
  update,
}: {
  block: APIMobileProfileBlock;
  update: (patch: Record<string, unknown>) => void;
}) {
  const radius = resolveProfileBlockCornerRadius(block, "mobile");
  const isCustom = isCustomProfileBlockCornerRadius(block);

  return (
    <FieldSection title="Corner radius">
      <Typography level="body-xs" textColor="muted">
        Round widget corners from {PROFILE_BLOCK_CORNER_RADIUS_MIN}px to{" "}
        {PROFILE_BLOCK_CORNER_RADIUS_MAX}px.
      </Typography>
      <Typography level="body-xs">
        Radius ({radius}px)
      </Typography>
      <Slider
        min={PROFILE_BLOCK_CORNER_RADIUS_MIN}
        max={PROFILE_BLOCK_CORNER_RADIUS_MAX}
        step={1}
        value={radius}
        onChange={(value) => {
          const next = Array.isArray(value) ? value[0] : value;
          update({
            cornerRadius: clampProfileBlockCornerRadius(next),
          });
        }}
      />
      {isCustom && (
        <Button
          color="neutral"
          onPress={() => update({ cornerRadius: undefined })}
        >
          Reset to default
        </Button>
      )}
    </FieldSection>
  );
}

function ProfileWidgetContentFields({
  block,
  profile,
  update,
  onStartDrawing,
  onOpenMusicSearch,
  onOpenGifPicker,
  onOpenStickerPicker,
}: {
  block: APIMobileProfileBlock;
  profile: UserProfile;
  update: (patch: Record<string, unknown>) => void;
  onStartDrawing?: () => void;
  onOpenMusicSearch?: () => void;
  onOpenGifPicker?: () => void;
  onOpenStickerPicker?: () => void;
}) {
  switch (block.type) {
    case "header":
      return (
        <FieldSection title="Banner crop">
          <Typography level="body-xs" textColor="muted">
            Shows your avatar, name, banner, and bio on the larger size.
          </Typography>
          <Typography level="body-xs">
            Crop position ({Math.round(block.bannerFocusY ?? 50)}%)
          </Typography>
          <Slider
            min={0}
            max={100}
            step={1}
            value={block.bannerFocusY ?? 50}
            onChange={(v) => update({ bannerFocusY: v })}
          />
        </FieldSection>
      );
    case "text":
      return (
        <FieldSection title="Text">
          <ProfileMarkdownField
            value={block.content}
            onChange={(content) => update({ content })}
            placeholder="Write something..."
            maxLength={2000}
            minHeight={100}
          />
        </FieldSection>
      );
    case "image":
      return (
        <ProfileImageFields
          src={block.src}
          objectFit={block.objectFit}
          crop={block.crop}
          profile={profile}
          update={update}
          onOpenGifPicker={onOpenGifPicker}
        />
      );
    case "sticker":
      return (
        <ProfileStickerFields
          block={block}
          update={update}
          onOpenStickerPicker={onOpenStickerPicker}
        />
      );
    case "music":
      return (
        <ProfileMusicFields
          block={block}
          update={update}
          onOpenMusicSearch={onOpenMusicSearch}
        />
      );
    case "links":
      return <ProfileLinksFields links={block.links} update={update} />;
    case "activity":
      return (
        <FieldSection title="Activity">
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography level="body-sm">Show custom status</Typography>
            <Switch
              checked={block.showCustomStatus ?? true}
              onChange={(showCustomStatus) => update({ showCustomStatus })}
            />
          </Box>
        </FieldSection>
      );
    case "roles":
      return (
        <FieldSection title="Roles">
          <Typography level="body-xs">
            Max roles shown ({block.maxRoles ?? 6})
          </Typography>
          <Slider
            min={1}
            max={12}
            step={1}
            value={block.maxRoles ?? 6}
            onChange={(v) => update({ maxRoles: v })}
          />
        </FieldSection>
      );
    case "mutual":
      return (
        <FieldSection title="Mutual">
          <ChipGroup
            options={[
              { value: "spaces" as const, label: "Mutual spaces" },
              { value: "friends" as const, label: "Friends status" },
            ]}
            value={block.mode}
            onChange={(mode) => update({ mode })}
          />
          <Typography level="body-xs">
            Max items shown ({block.maxItems ?? 6})
          </Typography>
          <Slider
            min={1}
            max={12}
            step={1}
            value={block.maxItems ?? 6}
            onChange={(v) => update({ maxItems: v })}
          />
        </FieldSection>
      );
    case "divider":
      return (
        <FieldSection title="Divider style">
          <ChipGroup
            options={[
              { value: "line" as const, label: "Line" },
              { value: "dotted" as const, label: "Dotted" },
              { value: "space" as const, label: "Space" },
            ]}
            value={block.style ?? "line"}
            onChange={(style) => update({ style })}
          />
        </FieldSection>
      );
    case "quote":
      return (
        <>
          <FieldSection title="Quote">
            <ProfileMarkdownField
              value={block.content}
              onChange={(content) => update({ content })}
              placeholder="Write a quote..."
              maxLength={1000}
              minHeight={100}
            />
          </FieldSection>
          <FieldSection title="Style">
            <ChipGroup
              options={[
                { value: "default" as const, label: "Default" },
                { value: "accent" as const, label: "Accent" },
                { value: "warning" as const, label: "Warning" },
              ]}
              value={block.variant ?? "default"}
              onChange={(variant) => update({ variant })}
            />
            <Input
              value={block.attribution ?? ""}
              onChangeText={(attribution) => update({ attribution })}
              placeholder="Attribution (optional)"
            />
          </FieldSection>
        </>
      );
    case "draw":
      return (
        <ProfileDrawFields block={block} onStartDrawing={onStartDrawing} />
      );
    default:
      return null;
  }
}

function ProfileDrawFields({
  block,
  onStartDrawing,
}: {
  block: Extract<APIMobileProfileBlock, { type: "draw" }>;
  onStartDrawing?: () => void;
}) {
  const drawPreviewHeight = useScaledProfilePreviewHeight(160);

  return (
    <FieldSection title="Drawing">
      {block.svgData ? (
        <Box
          style={{
            width: "100%",
            height: drawPreviewHeight,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: block.backgroundColor ?? "#1a1a2e",
          }}
        >
          <SvgXml xml={block.svgData} width="100%" height="100%" />
        </Box>
      ) : (
        <Typography level="body-sm" textColor="muted">
          No drawing yet. Open the canvas to sketch something for this widget.
        </Typography>
      )}
      <Button
        color="neutral"
        onPress={onStartDrawing}
        disabled={!onStartDrawing}
      >
        {block.svgData ? "Edit drawing" : "Start drawing"}
      </Button>
    </FieldSection>
  );
}

function ProfileStickerFields({
  block,
  update,
  onOpenStickerPicker,
}: {
  block: MobileProfileStickerBlock;
  update: (patch: Record<string, unknown>) => void;
  onOpenStickerPicker?: () => void;
}) {
  const stickerPreviewHeight = useScaledProfilePreviewHeight(140);

  return (
    <>
      <FieldSection title="Preview">
        <View style={{ width: "100%", height: stickerPreviewHeight }}>
          <ProfileStickerWidgetView block={block} />
        </View>
      </FieldSection>

      <FieldSection title="Sticker">
        <Button
          color="neutral"
          onPress={onOpenStickerPicker}
          disabled={!onOpenStickerPicker}
        >
          <StickerIcon size={14} />{" "}
          {block.expressionId ? "Change sticker" : "Choose sticker"}
        </Button>
        {block.expressionId ? (
          <Button
            color="neutral"
            onPress={() => update({ expressionId: "" })}
          >
            Remove sticker
          </Button>
        ) : null}
      </FieldSection>
    </>
  );
}

function ProfileImageFields({
  src,
  objectFit,
  crop,
  profile,
  update,
  onOpenGifPicker,
}: {
  src: string;
  objectFit?: "cover" | "contain";
  crop?: ProfileImageCrop | null;
  profile: UserProfile;
  update: (patch: Record<string, unknown>) => void;
  onOpenGifPicker?: () => void;
}) {
  const app = useAppStore();
  const [uploading, setUploading] = useState(false);
  const [recropping, setRecropping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imagePreviewHeight = useScaledProfilePreviewHeight(140);
  const canAdjustCrop = canAdjustProfileImageCrop(src);

  const previewUrl = src
    ? resolveProfileImageBlockUrl(src, (hash, animated) =>
        profile.constructBlockImageUrl(hash, undefined, undefined, animated),
      )
    : null;
  const previewIsVideo = previewUrl ? isProfileImageVideoUrl(previewUrl) : false;

  const uploadImage = async () => {
    if (uploading) return;

    try {
      const image = await pickProfileImageForUpload();
      if (!image) return;

      setUploading(true);
      setError(null);
      try {
        const result = await app.profiles.uploadAsset("image", {
          uri: image.path,
          type: image.mime,
          name: image.name,
        });
        update({ src: result.hash, crop: null });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to upload image");
      } finally {
        setUploading(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to pick image");
    }
  };

  const adjustCrop = async () => {
    if (recropping || !canAdjustCrop) return;

    const sourceUrl = profile.constructBlockImageSourceUrl(src);
    if (!sourceUrl) {
      setError("This image cannot be re-cropped");
      return;
    }

    try {
      setRecropping(true);
      setError(null);
      const nextCrop = await recropProfileImageFromUrl(sourceUrl);
      if (nextCrop) {
        update({ crop: nextCrop });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to adjust crop");
    } finally {
      setRecropping(false);
    }
  };

  return (
    <>
      {previewUrl && (
        <FieldSection title="Preview">
          {previewIsVideo ? (
            <ProfileBlockLoopingVideo
              uri={previewUrl}
              contentFit={objectFit === "contain" ? "contain" : "cover"}
              style={{
                width: "100%",
                height: imagePreviewHeight,
                borderRadius: 8,
              }}
            />
          ) : (
            <ProfileBlockCroppedImage
              uri={previewUrl}
              assetHash={isProfileImageCdnHash(src) ? src : null}
              crop={crop}
              containerStyle={{
                width: "100%",
                height: imagePreviewHeight,
                borderRadius: 8,
              }}
              resizeMode={objectFit === "contain" ? "contain" : "cover"}
            />
          )}
        </FieldSection>
      )}

      <FieldSection title="Image source">
        <Button color="neutral" disabled={uploading} onPress={uploadImage}>
          <UploadSimpleIcon size={14} />{" "}
          {uploading ? "Uploading..." : "Upload image"}
        </Button>
        <Button
          color="neutral"
          onPress={onOpenGifPicker}
          disabled={!onOpenGifPicker}
        >
          <GifIcon size={14} /> Choose GIF
        </Button>
        {canAdjustCrop && (
          <Button
            color="neutral"
            disabled={recropping || uploading}
            onPress={adjustCrop}
          >
            <CropIcon size={14} />{" "}
            {recropping ? "Opening cropper..." : "Adjust crop"}
          </Button>
        )}
        {crop && canAdjustCrop && (
          <Button color="neutral" onPress={() => update({ crop: null })}>
            Reset crop
          </Button>
        )}
        <Input
          value={src}
          onChangeText={(next) => update({ src: next, crop: null })}
          placeholder="Or paste an image URL"
          autoCapitalize="none"
        />
        {error && (
          <Typography level="body-xs" color="danger">
            {error}
          </Typography>
        )}
      </FieldSection>

      <FieldSection title="Display">
        <ChipGroup
          options={[
            { value: "cover" as const, label: "Cover" },
            { value: "contain" as const, label: "Contain" },
          ]}
          value={objectFit ?? "cover"}
          onChange={(next) => update({ objectFit: next })}
        />
        {canAdjustCrop && (
          <Typography level="body-xs" textColor="muted">
            Use Adjust crop to choose which part of the image shows in the
            widget. Full view always shows the original image.
          </Typography>
        )}
      </FieldSection>
    </>
  );
}

function ProfileMusicFields({
  block,
  update,
  onOpenMusicSearch,
}: {
  block: Extract<APIMobileProfileBlock, { type: "music" }>;
  update: (patch: Record<string, unknown>) => void;
  onOpenMusicSearch?: () => void;
}) {
  const app = useAppStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMp3 = async () => {
    if (uploading) return;

    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/mpeg",
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const file = result.assets[0];
    setUploading(true);
    setError(null);
    try {
      const uploaded = await app.profiles.uploadAsset("music", {
        uri: file.uri,
        type: file.mimeType ?? "audio/mpeg",
        name: file.name ?? "song.mp3",
      });
      update({
        audioHash: uploaded.hash,
        track: null,
        youtubeUrl: null,
        previewUrl: null,
        trackUrl: null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload song");
    } finally {
      setUploading(false);
    }
  };

  const currentLabel = block.audioHash
    ? (block.title ?? "Uploaded song")
    : block.track
      ? `${block.track.name} — ${block.track.artists}`
      : block.title || block.artists
        ? [block.title, block.artists].filter(Boolean).join(" — ")
        : "No song selected";

  return (
    <>
      <FieldSection title="Current song">
        <Typography level="body-sm" textColor="muted">
          {currentLabel}
        </Typography>
      </FieldSection>

      <FieldSection title="Change song">
        <Button
          color="neutral"
          onPress={onOpenMusicSearch}
          disabled={!onOpenMusicSearch}
        >
          Search for a song
        </Button>
        <Button
          color="neutral"
          disabled={uploading}
          onPress={() => void uploadMp3()}
        >
          <UploadSimpleIcon size={14} />{" "}
          {uploading ? "Uploading..." : "Upload MP3"}
        </Button>
        {error && (
          <Typography level="body-xs" color="danger">
            {error}
          </Typography>
        )}
      </FieldSection>

      <FieldSection title="YouTube link (optional)">
        <Input
          value={block.youtubeUrl ?? ""}
          onChangeText={(youtubeUrl) => update({ youtubeUrl })}
          placeholder="https://youtube.com/..."
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </FieldSection>
    </>
  );
}

function ProfileLinksFields({
  links,
  update,
}: {
  links: ProfileLinkItem[];
  update: (patch: Record<string, unknown>) => void;
}) {
  const rows = links.length > 0 ? links : [{ label: "", url: "" }];

  const setLink = (index: number, patch: Partial<ProfileLinkItem>) => {
    const next = rows.map((link, i) =>
      i === index ? { ...link, ...patch } : link,
    );
    update({ links: next });
  };

  const removeLink = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    update({ links: next.length > 0 ? next : [{ label: "", url: "" }] });
  };

  return (
    <FieldSection title="Links">
      <Box style={{ gap: 12 }}>
        {rows.map((link, index) => (
          <Box
            key={index}
            style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
          >
            <Box style={{ flex: 1, gap: 6 }}>
              <Input
                value={link.label}
                onChangeText={(label) => setLink(index, { label })}
                placeholder="Label"
              />
              <Input
                value={link.url}
                onChangeText={(url) => setLink(index, { url })}
                placeholder="https://..."
                autoCapitalize="none"
              />
            </Box>
            <IconButton
              variant="plain"
              color="danger"
              accessibilityLabel="Remove link"
              onPress={() => removeLink(index)}
            >
              <TrashIcon size={16} />
            </IconButton>
          </Box>
        ))}
      </Box>
      {rows.length < 8 && (
        <Button
          variant="soft"
          color="neutral"
          onPress={() => update({ links: [...rows, { label: "", url: "" }] })}
        >
          <PlusIcon size={14} /> Add link
        </Button>
      )}
    </FieldSection>
  );
}
