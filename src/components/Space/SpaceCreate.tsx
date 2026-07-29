import { Button } from "@components/Button";
import { CameraIcon } from "phosphor-react-native";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import type { APISpace, HttpException } from "@mutualzz/types";
import { Box, InputDefault, Typography, useTheme } from "@mutualzz/ui-native";
import {
  useScaledFeedPreviewSizes,
  useScaledSpaceCreateCardHeight,
} from "@utils/accessibilityLayout";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Image, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import ImagePicker from "react-native-image-crop-picker";
import { Paper } from "@components/Paper";

interface Props {
  setCreating: (creating: boolean) => void;
}

function extensionForMime(mime: string) {
  if (mime.includes("png")) return "png";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

export const SpaceCreate = observer(({ setCreating }: Props) => {
  const { t } = useTranslation("auth");
  const { t: tSpace } = useTranslation("space");
  const app = useAppStore();
  const { theme } = useTheme();
  const cardHeight = useScaledSpaceCreateCardHeight();
  const feedSizes = useScaledFeedPreviewSizes();

  const { closeAllSheets } = useSheet();

  const [name, setName] = useState("");
  const [iconUri, setIconUri] = useState<string | null>(null);
  const [iconMime, setIconMime] = useState("image/jpeg");
  const [error, setError] = useState<string | null>(null);

  const { mutate: createSpace, isPending: creating } = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("name", name.trim());

      if (iconUri) {
        const ext = extensionForMime(iconMime);
        formData.append("icon", {
          uri: iconUri,
          type: iconMime,
          name: `space-icon.${ext}`,
        } as unknown as Blob);
      }

      return app.rest.postFormData<APISpace>("spaces", formData);
    },
    onSuccess: () => {
      setIconUri(null);
      setIconMime("image/jpeg");
      setError(null);
      closeAllSheets();
    },
    onError: (err: HttpException) => {
      setError(
        err.errors?.[0]?.message ??
          err.message ??
          tSpace("profile.genericError"),
      );
    },
  });

  const handlePicker = () => {
    ImagePicker.openPicker({
      mediaType: "photo",
      cropping: true,
      cropperCircleOverlay: true,
    })
      .then((image) => {
        setIconUri(image.path);
        setIconMime(image.mime ?? "image/jpeg");
        setError(null);
      })
      .catch(() => { return; });
  };

  const onClear = () => {
    setIconUri(null);
    setIconMime("image/jpeg");
    setError(null);
  };

  const handleName = (nextName: string) => {
    setError(null);
    setName(nextName);
  };

  const handleCreate = () => {
    if (name.trim() === "") {
      setError(t("onboarding.createSpace.nameRequired"));
      return;
    }

    createSpace();
  };

  return (
    <Paper
      elevation={app.settings?.preferEmbossed ? 2 : 0}
      style={{
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        height: cardHeight,
        borderWidth: 0,
        paddingVertical: 8,
        paddingHorizontal: 16,
      }}
    >
      <Typography level="h5" weight="bold">
        {t("onboarding.createSpace.title")}
      </Typography>
      <Box
        style={{
          width: "100%",
          flex: 1,
          position: "relative",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 10,
        }}
      >
        <Pressable onPress={() => handlePicker()}>
          {iconUri ? (
            <Image
              source={{ uri: iconUri }}
              style={{
                width: feedSizes.sticker,
                height: feedSizes.sticker,
                borderRadius: 9999,
              }}
            />
          ) : (
            <Box
              style={{
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                borderRadius: 9999,
                width: feedSizes.sticker,
                height: feedSizes.sticker,
                borderStyle: "dashed",
                borderWidth: 1,
                borderColor: theme.colors.neutral,
                gap: 4,
              }}
            >
              <CameraIcon
                color={theme.typography.colors.primary}
                size={16}
                weight="fill"
              />
              <Typography weight="bold" level="body-xs">
                {t("onboarding.createSpace.upload")}
              </Typography>
            </Box>
          )}
        </Pressable>
      </Box>
      <Box
        style={{
          gap: 4,
          flexDirection: "column",
          width: "100%",
          justifyContent: "center",
        }}
      >
        <Typography weight={500} level="body-sm">
          {t("onboarding.createSpace.name")}{" "}
          <Typography variant="plain" color="danger">
            *
          </Typography>
        </Typography>
        <InputDefault
          fullWidth
          value={name}
          onChangeText={handleName}
          accessibilityLabel={t("onboarding.createSpace.spaceNameA11y")}
        />
        {error && (
          <Typography variant="plain" color="danger" level="body-sm">
            {error}
          </Typography>
        )}
      </Box>

      <Box
        style={{
          marginTop: 12,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box style={{ flexDirection: "row", gap: 10 }}>
          {iconUri && (
            <Button expand disabled={creating} onPress={onClear}>
              {t("onboarding.createSpace.reset")}
            </Button>
          )}
          <Button
            expand
            disabled={creating || name.trim() === "" || !!error}
            onPress={() => handleCreate()}
            variant="solid"
            color="success"
          >
            {t("onboarding.createSpace.createSpace")}
          </Button>
        </Box>
      </Box>
      <Box
        style={{
          gap: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 12,
        }}
      >
        <Typography>{t("onboarding.createSpace.alreadyHaveInvite")}</Typography>
        <Pressable onPress={() => setCreating(false)}>
          <Typography variant="plain" color="primary" disabled={creating}>
            {t("onboarding.createSpace.backToJoin")}
          </Typography>
        </Pressable>
      </Box>
    </Paper>
  );
});
