import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import type { APIExpression } from "@mutualzz/types";
import { ExpressionType } from "@mutualzz/types";
import { Box, Input, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Image } from "react-native";

interface Props {
  type: ExpressionType;
  uri: string;
  mimeType: string;
  fileName: string;
  modalId?: string;
  spaceId?: string;
}

export const ExpressionUploadSheet = observer(
  ({
    type,
    uri,
    mimeType,
    fileName,
    modalId = "expression-upload",
    spaceId,
  }: Props) => {
    const app = useAppStore();
    const { closeModal } = useModal();
    const [name, setName] = useState(
      fileName.replace(/\.[^.]+$/, "").slice(0, 32),
    );
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const label = type === ExpressionType.Emoji ? "emoji" : "sticker";

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

        closeModal(modalId);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : typeof e === "object" &&
                e &&
                "message" in e &&
                typeof e.message === "string"
              ? e.message
              : `Failed to upload ${label}`;
        setError(message);
      } finally {
        setUploading(false);
      }
    };

    return (
      <Paper
        style={{
          width: 320,
          maxWidth: "100%",
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        <Typography level="body-md" weight={700}>
          Upload {label}
        </Typography>

        <Box style={{ alignItems: "center", paddingVertical: 8 }}>
          <Image
            source={{ uri }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 8,
            }}
            resizeMode="contain"
          />
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-xs" textColor="muted">
            Name
          </Typography>
          <Input
            value={name}
            onChangeText={setName}
            placeholder={`my_${label}`}
            maxLength={32}
            autoCapitalize="none"
          />
          <Typography level="body-xs" textColor="muted">
            Use as :{name.trim() || label}:
          </Typography>
        </Box>

        {error && (
          <Typography level="body-sm" color="danger" variant="plain">
            {error}
          </Typography>
        )}

        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button
            variant="soft"
            color="neutral"
            style={{ flex: 1 }}
            disabled={uploading}
            onPress={() => closeModal(modalId)}
          >
            Cancel
          </Button>
          <Button
            color="success"
            style={{ flex: 1 }}
            disabled={!name.trim() || uploading}
            onPress={() => void handleUpload()}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </Box>
      </Paper>
    );
  },
);
