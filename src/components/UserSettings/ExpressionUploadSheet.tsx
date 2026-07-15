import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import type { APIExpression } from "@mutualzz/types";
import { ExpressionType } from "@mutualzz/types";
import { Box, Input, Typography } from "@mutualzz/ui-native";
import { useScaledFeedPreviewSizes } from "@utils/accessibilityLayout";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Image, View } from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import { useTranslation } from "react-i18next";

interface Props {
  type: ExpressionType;
  uri: string;
  mimeType: string;
  fileName: string;
  spaceId?: string;
  onClose: () => void;
}

export const ExpressionUploadSheet = observer(
  ({ type, uri, mimeType, fileName, spaceId, onClose }: Props) => {
    const { t } = useTranslation("settings");
    const app = useAppStore();
    const feedSizes = useScaledFeedPreviewSizes();
    const [name, setName] = useState(
      fileName.replace(/\.[^.]+$/, "").slice(0, 32),
    );
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const isEmoji = type === ExpressionType.Emoji;

    const handleUpload = async () => {
      const trimmed = name.trim();
      if (!trimmed || uploading) return;

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("expression", {
          uri,
          type: mimeType,
          name: fileName,
        } as unknown as Blob);
        formData.append("type", String(type));
        formData.append("name", trimmed);
        if (spaceId) {
          formData.append("spaceId", spaceId);
        }

        const created = await app.rest.putFormData<APIExpression>(
          "expressions",
          formData,
        );

        if (created) {
          app.expressions.add(created);
          if (spaceId) {
            app.spaces.get(spaceId)?.addExpression(created);
          }
        }

        onClose();
        void ImagePicker.clean();
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : typeof e === "object" &&
                e &&
                "message" in e &&
                typeof e.message === "string"
              ? e.message
              : isEmoji
                ? t("expressions.uploadFailedEmoji")
                : t("expressions.uploadFailedSticker");
        setError(message);
      } finally {
        setUploading(false);
      }
    };

    return (
      <View
        style={{
          width: "100%",
          padding: 16,
          gap: 12,
        }}
      >
        <Typography level="body-md" weight={700}>
          {isEmoji
            ? t("expressions.uploadEmojiTitle")
            : t("expressions.uploadStickerTitle")}
        </Typography>

        <Box style={{ alignItems: "center", paddingVertical: 8 }}>
          <Image
            source={{ uri }}
            style={{
              width: feedSizes.sticker,
              height: feedSizes.sticker,
              borderRadius: 8,
            }}
            resizeMode="contain"
          />
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-xs" textColor="muted">
            {t("expressions.name")}
          </Typography>
          <Input
            value={name}
            onChangeText={setName}
            placeholder={
              isEmoji
                ? t("expressions.namePlaceholderEmoji")
                : t("expressions.namePlaceholderSticker")
            }
            maxLength={32}
            autoCapitalize="none"
          />
          <Typography level="body-xs" textColor="muted">
            {t("expressions.useAs", {
              name: name.trim() || (isEmoji ? "emoji" : "sticker"),
            })}
          </Typography>
        </Box>

        {error && (
          <Typography level="body-sm" color="danger" variant="plain">
            {error}
          </Typography>
        )}

        <Button
          color="success"
          disabled={!name.trim() || uploading}
          onPress={() => void handleUpload()}
        >
          {uploading ? t("expressions.uploading") : t("expressions.upload")}
        </Button>
      </View>
    );
  },
);
