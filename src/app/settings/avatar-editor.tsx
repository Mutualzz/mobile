import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { Paper } from "@components/Paper";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { ImageFormat, type Sizes, type APIPrivateUser } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Image, ScrollView } from "react-native";
import ImagePicker from "react-native-image-crop-picker";

export default observer(function AvatarEditorScreen() {
  const app = useAppStore();
  const { back } = useAppNavigation();
  const account = app.account;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!account) return null;

  const previousAvatars = account.previousAvatars;

  const uploadAvatarFile = async (uri: string, mime = "image/png") => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", {
        uri,
        type: mime,
        name: "avatar.png",
      } as unknown as Blob);
      const updated = await app.rest.patchFormData<APIPrivateUser>(
        "@me",
        formData,
      );
      account.update(updated);
      back();
    } catch (e) {
      setError(getErrorMessage(e, "Failed to upload avatar"));
    } finally {
      setUploading(false);
    }
  };

  const uploadFromLibrary = () => {
    ImagePicker.openPicker({
      mediaType: "photo",
      cropping: true,
      width: 512,
      height: 512,
    })
      .then((image) => uploadAvatarFile(image.path, image.mime ?? "image/jpeg"))
      .catch(() => undefined)
      .finally(() => {
        void ImagePicker.clean();
      });
  };

  const openDrawCropper = () => {
    uploadFromLibrary();
  };

  const selectPreviousAvatar = async (hash: string) => {
    setUploading(true);
    setError(null);

    try {
      const updated = await app.rest.patch<APIPrivateUser>("@me", {
        avatar: hash,
      });
      account.update(updated);
      back();
    } catch (e) {
      setError(getErrorMessage(e, "Failed to restore avatar"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <SettingsScreen title="Avatar Studio" contentStyle={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      >
        <Paper style={{ padding: 16, borderRadius: 12, gap: 12 }}>
          <Typography level="body-md" weight={700}>
            Upload
          </Typography>
          <Typography level="body-sm" textColor="muted">
            Pick a photo or GIF from your library.
          </Typography>
          <Button disabled={uploading} onPress={uploadFromLibrary}>
            Choose from library
          </Button>
        </Paper>

        <Paper style={{ padding: 16, borderRadius: 12, gap: 12 }}>
          <Typography level="body-md" weight={700}>
            Draw
          </Typography>
          <Typography level="body-sm" textColor="muted">
            Use the library picker to crop a sketch or exported drawing.
          </Typography>
          <Button disabled={uploading} variant="soft" onPress={openDrawCropper}>
            Open crop editor
          </Button>
        </Paper>

        <Paper style={{ padding: 16, borderRadius: 12, gap: 12 }}>
          <Typography level="body-md" weight={700}>
            Previous avatars
          </Typography>
          {previousAvatars.length === 0 ? (
            <Typography textColor="muted" level="body-sm">
              No previous avatars yet.
            </Typography>
          ) : (
            <Box
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {previousAvatars.map((hash) => (
                <IconButton
                  key={hash}
                  variant="plain"
                  padding={0}
                  disabled={uploading}
                  onPress={() => void selectPreviousAvatar(hash)}
                >
                  <Image
                    source={{
                      uri: account.constructAvatarUrl(
                        hash.startsWith("a_"),
                        "light",
                        48 as Sizes,
                        ImageFormat.PNG,
                        hash,
                      ),
                    }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 9999,
                    }}
                  />
                </IconButton>
              ))}
            </Box>
          )}
        </Paper>

        {error && (
          <Typography level="body-sm" color="danger" variant="plain">
            {error}
          </Typography>
        )}
      </ScrollView>
    </SettingsScreen>
  );
});

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
}
