import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import {
  ProfileDrawCanvas,
  renderStrokesToSvg,
  type DrawCanvasState,
} from "@components/Profile/widgets/editor/ProfileDrawCanvas";
import { ProfileWidgetMusicPicker } from "@components/Profile/widgets/editor/ProfileWidgetMusicPicker";
import { useAppStore } from "@hooks/useStores";
import type { UserProfile } from "@stores/objects/UserProfile";
import type { APIMobileProfileBlock, ProfileLinkItem } from "@mutualzz/types";
import { Box, Input, Switch, Slider, Typography, useTheme } from "@mutualzz/ui-native";
import * as DocumentPicker from "expo-document-picker";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  UploadSimpleIcon,
} from "phosphor-react-native";
import type { ReactNode } from "react";
import { useState } from "react";
import { Image, Modal, Pressable, ScrollView } from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";

interface Props {
  visible: boolean;
  onClose: () => void;
  block: APIMobileProfileBlock | null;
  profile: UserProfile;
  onUpdate: (blockId: string, patch: Record<string, unknown>) => void;
  onDelete: (blockId: string) => void;
}

export function ProfileWidgetContentEditorSheet({
  visible,
  onClose,
  block,
  profile,
  onUpdate,
  onDelete,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  if (!block) return null;

  const update = (patch: Record<string, unknown>) => onUpdate(block.id, patch);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Box style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <IconButton padding={6} onPress={onClose} accessibilityLabel="Back">
            <ArrowLeftIcon size={20} />
          </IconButton>
          <Typography level="title-md" weight="bold">
            Edit Widget
          </Typography>
        </Box>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <ProfileWidgetContentFields block={block} profile={profile} update={update} />
        </ScrollView>

        <Box style={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
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
        </Box>
      </Box>
    </Modal>
  );
}

function FieldSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper
      elevation={1}
      style={{ borderRadius: 12, padding: 14, gap: 10 }}
    >
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
              backgroundColor: active ? `${theme.colors.primary}18` : "transparent",
            }}
          >
            <Typography
              level="body-xs"
              weight={active ? "bold" : undefined}
              style={{
                color: active ? theme.colors.primary : theme.typography.colors.muted,
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

function ProfileWidgetContentFields({
  block,
  profile,
  update,
}: {
  block: APIMobileProfileBlock;
  profile: UserProfile;
  update: (patch: Record<string, unknown>) => void;
}) {
  switch (block.type) {
    case "header":
      return (
        <FieldSection title="Banner crop">
          <Typography level="body-xs" textColor="muted">
            Shows your avatar, name, and (at the larger size) banner and bio.
          </Typography>
          <Typography level="body-xs">
            Crop position ({Math.round(block.bannerFocusY ?? 50)}%)
          </Typography>
          <Slider
            min={0}
            max={100}
            step={1}
            value={block.bannerFocusY ?? 50}
            onChange={(v) => update({ bannerFocusY: v as number })}
          />
        </FieldSection>
      );
    case "text":
      return (
        <FieldSection title="Text">
          <Input
            value={block.content}
            onChangeText={(content) => update({ content })}
            placeholder="Write something..."
            multiline
            maxLength={2000}
            style={{ minHeight: 100, textAlignVertical: "top" }}
          />
        </FieldSection>
      );
    case "image":
      return (
        <ProfileImageFields
          src={block.src}
          objectFit={block.objectFit}
          profile={profile}
          update={update}
        />
      );
    case "music":
      return <ProfileMusicFields block={block} update={update} />;
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
            onChange={(v) => update({ maxRoles: v as number })}
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
            onChange={(v) => update({ maxItems: v as number })}
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
            <Input
              value={block.content}
              onChangeText={(content) => update({ content })}
              placeholder="Write a quote..."
              multiline
              maxLength={1000}
              style={{ minHeight: 80, textAlignVertical: "top" }}
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
      return <ProfileDrawFields block={block} update={update} />;
    default:
      return null;
  }
}

function ProfileDrawFields({
  block,
  update,
}: {
  block: Extract<APIMobileProfileBlock, { type: "draw" }>;
  update: (patch: Record<string, unknown>) => void;
}) {
  const [canvasOpen, setCanvasOpen] = useState(false);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const initialCanvasState: DrawCanvasState | null = (() => {
    if (!block.paths) return null;
    try {
      return JSON.parse(block.paths) as DrawCanvasState;
    } catch {
      return null;
    }
  })();

  const handleSave = (state: DrawCanvasState) => {
    update({
      paths: JSON.stringify(state),
      svgData: renderStrokesToSvg(state),
      backgroundColor: state.backgroundColor,
    });
    setCanvasOpen(false);
  };

  return (
    <FieldSection title="Drawing">
      {block.svgData ? (
        <Box style={{ width: "100%", height: 160, borderRadius: 8, overflow: "hidden" }}>
          <SvgXml xml={block.svgData} width="100%" height="100%" />
        </Box>
      ) : null}
      <Button color="neutral" onPress={() => setCanvasOpen(true)}>
        {block.svgData ? "Edit drawing" : "Start drawing"}
      </Button>

      <Modal
        visible={canvasOpen}
        animationType="slide"
        onRequestClose={() => setCanvasOpen(false)}
      >
        <Box
          style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}
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
              onPress={() => setCanvasOpen(false)}
              accessibilityLabel="Back"
            >
              <ArrowLeftIcon size={20} />
            </IconButton>
            <Typography level="title-md" weight="bold">
              Draw
            </Typography>
          </Box>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16, gap: 16 }}>
            <ProfileDrawCanvas
              initial={initialCanvasState}
              onCancel={() => setCanvasOpen(false)}
              onSave={handleSave}
            />
          </ScrollView>
        </Box>
      </Modal>
    </FieldSection>
  );
}

function ProfileImageFields({
  src,
  objectFit,
  profile,
  update,
}: {
  src: string;
  objectFit?: "cover" | "contain";
  profile: UserProfile;
  update: (patch: Record<string, unknown>) => void;
}) {
  const app = useAppStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = src
    ? src.startsWith("http")
      ? src
      : profile.constructBlockImageUrl(src)
    : null;

  const uploadImage = () => {
    if (uploading) return;

    ImagePicker.openPicker({
      mediaType: "photo",
      cropping: true,
      freeStyleCropEnabled: true,
    })
      .then(async (image) => {
        setUploading(true);
        setError(null);
        try {
          const result = await app.profiles.uploadAsset("image", {
            uri: image.path,
            type: image.mime ?? "image/jpeg",
            name: image.filename ?? "image.jpg",
          });
          update({ src: result.hash });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to upload image");
        } finally {
          setUploading(false);
          void ImagePicker.clean();
        }
      })
      .catch(() => undefined)
      .finally(() => void ImagePicker.clean());
  };

  return (
    <>
      {previewUrl ? (
        <FieldSection title="Preview">
          <Image
            source={{ uri: previewUrl }}
            style={{ width: "100%", height: 140, borderRadius: 8 }}
            resizeMode="cover"
          />
        </FieldSection>
      ) : null}

      <FieldSection title="Image source">
        <Button color="neutral" disabled={uploading} onPress={uploadImage}>
          <UploadSimpleIcon size={14} /> {uploading ? "Uploading..." : "Upload image"}
        </Button>
        <Input
          value={src}
          onChangeText={(next) => update({ src: next })}
          placeholder="Or paste an image URL"
          autoCapitalize="none"
        />
        {error ? (
          <Typography level="body-xs" color="danger">
            {error}
          </Typography>
        ) : null}
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
      </FieldSection>
    </>
  );
}

function ProfileMusicFields({
  block,
  update,
}: {
  block: Extract<APIMobileProfileBlock, { type: "music" }>;
  update: (patch: Record<string, unknown>) => void;
}) {
  const app = useAppStore();
  const [pickerOpen, setPickerOpen] = useState(false);
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
        <Button color="neutral" onPress={() => setPickerOpen(true)}>
          Search for a song
        </Button>
        <Button color="neutral" disabled={uploading} onPress={() => void uploadMp3()}>
          <UploadSimpleIcon size={14} /> {uploading ? "Uploading..." : "Upload MP3"}
        </Button>
        {error ? (
          <Typography level="body-xs" color="danger">
            {error}
          </Typography>
        ) : null}
      </FieldSection>

      <FieldSection title="YouTube link (optional)">
        <Input
          value={block.youtubeUrl ?? ""}
          onChangeText={(youtubeUrl) => update({ youtubeUrl })}
          placeholder="https://youtube.com/..."
          autoCapitalize="none"
        />
      </FieldSection>

      <ProfileWidgetMusicPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
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
          setPickerOpen(false);
        }}
      />
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
    const next = rows.map((link, i) => (i === index ? { ...link, ...patch } : link));
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
