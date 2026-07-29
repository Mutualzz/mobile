import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { useAppStore } from "@hooks/useStores";
import type { APISpace, HttpException } from "@mutualzz/types";
import { Box, InputDefault, Typography, useTheme } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import type { Selection } from "@utils/markdown/types";
import {
  useScaledDescriptionMinHeight,
  useScaledSquareSize,
} from "@utils/accessibilityLayout";
import { CameraIcon, TrashIcon } from "phosphor-react-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Image, Pressable } from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import { useTranslation } from "react-i18next";

interface Props {
  space: Space;
}

export const SpaceProfileSettings = observer(({ space }: Props) => {
  const { t } = useTranslation("space");
  const { t: tSettings } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const app = useAppStore();
  const { theme } = useTheme();
  const spaceIconSize = useScaledSquareSize(80);
  const descriptionMinHeight = useScaledDescriptionMinHeight(100);

  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description ?? "");
  const [descriptionSelection, setDescriptionSelection] = useState<Selection>({
    start: 0,
    end: 0,
  });
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<Blob | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<object | null>(
    null,
  );
  const [removeIcon, setRemoveIcon] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    name.trim() !== space.name ||
    (description ?? "") !== (space.description ?? "") ||
    imageFile !== null ||
    removeIcon;

  const { mutate: saveProfile, isPending: saving } = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description);

      if (removeIcon) {
        formData.append("icon", "");
      } else if (originalFile) {
        formData.append("icon", originalFile);
        if (croppedAreaPixels) {
          formData.append("crop", JSON.stringify(croppedAreaPixels));
        }
      }

      return app.rest.patchFormData<APISpace>(`/spaces/${space.id}`, formData);
    },
    onSuccess: (updated) => {
      space.update(updated);
      setImageFile(null);
      setOriginalFile(null);
      setCroppedAreaPixels(null);
      setRemoveIcon(false);
      setError(null);
    },
    onError: (err: HttpException) => {
      setError(
        err.errors?.[0]?.message ?? err.message ?? t("profile.genericError"),
      );
    },
  });

  const handlePickIcon = () => {
    ImagePicker.openPicker({
      mediaType: "photo",
      cropping: true,
      cropperCircleOverlay: true,
    })
      .then(async (image) => {
        setCroppedAreaPixels(image.cropRect ?? null);
        const res = await fetch(image.path);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onload = () => {
          setImageFile(reader.result as string);
          setOriginalFile(blob);
        };
        reader.readAsDataURL(blob);
        setRemoveIcon(false);
        setError(null);
      })
      .catch(() => { return; });
  };

  const clearImage = () => {
    setImageFile(null);
    setOriginalFile(null);
    setCroppedAreaPixels(null);
  };

  return (
    <Box style={{ gap: 16, padding: 12 }}>
      <Box style={{ gap: 8 }}>
        <Typography level="body-sm" weight={600}>
          {t("profile.spaceIcon")}
        </Typography>
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          {imageFile ? (
            <Box style={{ gap: 8, alignItems: "center" }}>
              <Image
                source={{ uri: imageFile }}
                style={{
                  width: spaceIconSize,
                  height: spaceIconSize,
                  borderRadius: spaceIconSize / 2,
                }}
              />
              <Button
                size="sm"
                variant="plain"
                color="danger"
                onPress={clearImage}
              >
                {tCommon("cancel")}
              </Button>
            </Box>
          ) : (
            <Pressable onPress={handlePickIcon} disabled={saving}>
              <Box
                style={{
                  position: "relative",
                  width: spaceIconSize,
                  height: spaceIconSize,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SpaceIcon
                  space={removeIcon ? null : space}
                  size={spaceIconSize}
                />
                <Box
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    borderRadius: spaceIconSize / 2,
                    backgroundColor: "rgba(0,0,0,0.45)",
                  }}
                >
                  <CameraIcon
                    size={18}
                    color={theme.typography.colors.primary}
                    weight="fill"
                  />
                  <Typography
                    level="body-xs"
                    weight={700}
                    style={{ textAlign: "center" }}
                  >
                    {tSettings("account.change")}
                  </Typography>
                </Box>
              </Box>
            </Pressable>
          )}

          {!imageFile && space.icon && !removeIcon && (
            <Button
              size="sm"
              variant="soft"
              color="danger"
              startDecorator={<TrashIcon size={16} weight="fill" />}
              onPress={() => setRemoveIcon(true)}
              disabled={saving}
            >
              {tSettings("profile.remove")}
            </Button>
          )}

          {removeIcon && (
            <Button
              size="sm"
              variant="plain"
              onPress={() => setRemoveIcon(false)}
              disabled={saving}
            >
              {tCommon("restore")}
            </Button>
          )}
        </Box>
      </Box>

      <Box style={{ gap: 8 }}>
        <Typography level="body-sm" weight={600}>
          {t("profile.name")}{" "}
          <Typography variant="plain" color="danger">
            *
          </Typography>
        </Typography>
        <InputDefault
          fullWidth
          value={name}
          onChangeText={(value) => {
            setError(null);
            setName(value);
          }}
          editable={!saving}
        />
      </Box>

      <Box style={{ gap: 8 }}>
        <Typography level="body-sm" weight={600}>
          {t("profile.description")}
        </Typography>
        <Paper
          style={{
            padding: 8,
            borderRadius: 12,
            minHeight: descriptionMinHeight,
          }}
          elevation={app.settings?.preferEmbossed ? 2 : 0}
        >
          <MarkdownInput
            value={description}
            onChange={setDescription}
            selection={descriptionSelection}
            onChangeSelection={setDescriptionSelection}
            placeholder={t("profile.descriptionPlaceholder")}
            editable={!saving}
            enableMentions={false}
            enableEmoticons={false}
            enableEmojiAutocomplete={false}
            elevation={0}
          />
        </Paper>
      </Box>

      {error && (
        <Typography variant="plain" color="danger" level="body-sm">
          {error}
        </Typography>
      )}

      <Box
        style={{
          flexDirection: "row",
          gap: 8,
          justifyContent: "flex-end",
        }}
      >
        {hasChanges && (
          <Button
            variant="plain"
            disabled={saving}
            onPress={() => {
              setName(space.name);
              setDescription(space.description ?? "");
              clearImage();
              setRemoveIcon(false);
              setError(null);
            }}
          >
            {tSettings("themeCreator.actions.reset")}
          </Button>
        )}
        <Button
          color="success"
          disabled={!hasChanges || saving || !name.trim()}
          onPress={() => saveProfile()}
        >
          {saving
            ? tSettings("profile.saving")
            : tSettings("profile.saveChanges")}
        </Button>
      </Box>
    </Box>
  );
});
