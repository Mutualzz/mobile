import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import {
  createColor,
  extractColors,
  isValidGradient,
  type ColorLike,
} from "@mutualzz/ui-core";
import { Box, Typography } from "@mutualzz/ui-native";
import { Theme } from "@stores/objects/Theme";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Image } from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import { ThemeCreatorColorField } from "./ThemeCreatorColorField";

export const ThemeCreatorBasePage = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const {
    values,
    setValues,
    pendingBackgroundPreviewUrl,
    setPendingBackgroundFile,
    markClearBackgroundImage,
    clearBackgroundImage,
  } = app.themeCreator;

  const existingUrl =
    !clearBackgroundImage && !pendingBackgroundPreviewUrl && values.id
      ? Theme.resolveBackgroundImageUrl(values.id, values.backgroundImage)
      : null;
  const previewUrl = pendingBackgroundPreviewUrl || existingUrl;

  const applyBackgroundColor = (color: ColorLike) => {
    let isDark: boolean;
    let isGradient = false;

    if (
      isValidGradient(color) &&
      extractColors(color) &&
      extractColors(color)!.length > 0
    ) {
      isDark = createColor(extractColors(color)![0]).isDark();
      isGradient = true;
    } else {
      isDark = createColor(color).isDark();
    }

    setValues({
      ...values,
      type: isDark ? "dark" : "light",
      style: isGradient ? "gradient" : "normal",
      colors: { ...values.colors, background: color },
    });
  };

  const pickBackgroundImage = () => {
    ImagePicker.openPicker({
      mediaType: "photo",
      cropping: false,
      includeBase64: false,
    })
      .then((image) => {
        setPendingBackgroundFile({
          uri: image.path,
          type: image.mime ?? "image/jpeg",
          name: image.filename ?? "background.jpg",
        });
        setValues({ wallpaper: null });
      })
      .catch(() => { return; })
      .finally(() => {
        void ImagePicker.clean();
      });
  };

  return (
    <Box style={{ gap: 10 }}>
      <ThemeCreatorColorField
        label={t("themeCreator.colors.backgroundShort")}
        value={values.colors.background}
        onChange={applyBackgroundColor}
        allowGradient
      />
      <Box style={{ gap: 8 }}>
        <Typography level="body-sm" weight={700}>
          {t("themeCreator.colors.backgroundImage")}
        </Typography>
        <Typography level="body-xs" textColor="muted">
          {t("themeCreator.colors.backgroundImageDescription")}
        </Typography>
        {previewUrl && (
          <Image
            source={{ uri: previewUrl }}
            style={{
              width: "100%",
              height: 140,
              borderRadius: 8,
            }}
            resizeMode="cover"
          />
        )}
        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button expand variant="soft" onPress={pickBackgroundImage}>
            {t("themeCreator.colors.chooseBackgroundImage")}
          </Button>
          {(previewUrl || values.backgroundImage) && (
            <Button
              expand
              variant="plain"
              color="danger"
              onPress={() => markClearBackgroundImage()}
            >
              {t("themeCreator.colors.removeBackgroundImage")}
            </Button>
          )}
        </Box>
      </Box>
      <ThemeCreatorColorField
        label={t("themeCreator.colors.surfaceShort")}
        value={values.colors.surface}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, surface: color } })
        }
        allowGradient
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.blackShort")}
        value={values.colors.common.black}
        onChange={(color: ColorLike) =>
          setValues({
            colors: {
              ...values.colors,
              common: { ...values.colors.common, black: color },
            },
          })
        }
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.whiteShort")}
        value={values.colors.common.white}
        onChange={(color: ColorLike) =>
          setValues({
            colors: {
              ...values.colors,
              common: { ...values.colors.common, white: color },
            },
          })
        }
      />
    </Box>
  );
});
