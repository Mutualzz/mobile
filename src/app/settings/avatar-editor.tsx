import { AvatarDrawDraftsSection } from "@components/Avatar/AvatarDrawDraftsSection";
import { AvatarDrawEditor } from "@components/Avatar/AvatarDrawEditor";
import { AvatarStudioMethodCards } from "@components/Avatar/AvatarStudioMethodCards";
import { IconButton } from "@components/IconButton";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { Paper } from "@components/Paper";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { ImageFormat, type Sizes, type APIPrivateUser } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import { useScaledAvatarEditorSizes } from "@utils/accessibilityLayout";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, View } from "react-native";
import ImagePicker from "react-native-image-crop-picker";

export default observer(function AvatarEditorScreen() {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { back } = useAppNavigation();
  const account = app.account;
  const avatarSizes = useScaledAvatarEditorSizes();
  const scrollRef = useRef<ScrollView>(null);
  const presetsOffsetRef = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawDraftId, setDrawDraftId] = useState<string | null>(null);
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
      setError(getErrorMessage(e, t("profile.failedUploadAvatar")));
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

  const openDrawEditor = (draftId?: string) => {
    setDrawDraftId(draftId ?? null);
    setDrawOpen(true);
  };

  const scrollToPresets = () => {
    scrollRef.current?.scrollTo({
      y: presetsOffsetRef.current,
      animated: true,
    });
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
      setError(getErrorMessage(e, t("profile.failedRestoreAvatar")));
    } finally {
      setUploading(false);
    }
  };

  return (
    <SettingsScreen title={t("profile.avatarStudio")} contentStyle={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      >
        <Paper
          variant="soft"
          style={{ padding: 16, borderRadius: 12, gap: 12 }}
          elevation={app.settings?.preferEmbossed ? 2 : 0}
        >
          <Typography level="body-md" weight={700}>
            {t("profile.avatarStudio")}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {t("profile.avatarStudioDescriptionMobile")}
          </Typography>
        </Paper>

        <AvatarStudioMethodCards
          embossed={app.settings?.preferEmbossed}
          onUpload={uploadFromLibrary}
          onDraw={() => openDrawEditor()}
          onAvatars={scrollToPresets}
        />

        <AvatarDrawDraftsSection
          embossed={app.settings?.preferEmbossed}
          onOpenDraft={(draftId) => openDrawEditor(draftId)}
        />

        <Paper
          style={{ padding: 16, borderRadius: 12, gap: 12 }}
          elevation={app.settings?.preferEmbossed ? 2 : 0}
        >
          <Typography level="body-md" weight={700}>
            {t("profile.currentAvatar")}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {t("profile.currentAvatarDescription")}
          </Typography>
          <Box style={{ alignItems: "center", paddingVertical: 4 }}>
            <Image
              source={{
                uri:
                  account.avatarUrl ??
                  account.constructAvatarUrl(
                    false,
                    "light",
                    128,
                    ImageFormat.PNG,
                  ),
              }}
              style={{
                width: avatarSizes.current,
                height: avatarSizes.current,
                borderRadius: 999,
              }}
            />
          </Box>
        </Paper>

        <View
          onLayout={(event) => {
            presetsOffsetRef.current = event.nativeEvent.layout.y;
          }}
        >
          <Paper
            style={{ padding: 16, borderRadius: 12, gap: 12 }}
            elevation={app.settings?.preferEmbossed ? 2 : 0}
          >
            <Typography level="body-md" weight={700}>
              {t("profile.avatarPresets")}
            </Typography>
            <Typography level="body-sm" textColor="muted">
              {t("profile.avatarPresetsDescription")}
            </Typography>
            {previousAvatars.length === 0 ? (
              <Typography textColor="muted" level="body-sm">
                {t("profile.noPreviousAvatars")}
              </Typography>
            ) : (
              <Box
                style={{
                  padding: 8,
                  gap: 16,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-around",
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
                        width: avatarSizes.preset,
                        height: avatarSizes.preset,
                        borderRadius: 9999,
                      }}
                    />
                  </IconButton>
                ))}
              </Box>
            )}
          </Paper>
        </View>

        {error && (
          <Typography level="body-sm" color="danger" variant="plain">
            {error}
          </Typography>
        )}
      </ScrollView>

      <AvatarDrawEditor
        visible={drawOpen}
        initialDraftId={drawDraftId}
        onClose={() => {
          setDrawOpen(false);
          setDrawDraftId(null);
        }}
        onUploaded={() => back()}
      />
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
