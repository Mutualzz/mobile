import { Paper } from "@components/Paper";
import { AvatarStudioMethodCards } from "@components/Avatar/AvatarStudioMethodCards";
import { Button } from "@components/Button";
import { UserAvatar } from "@components/User/UserAvatar";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { APIPrivateUser } from "@mutualzz/types";
import { Box, Divider, Input, Typography } from "@mutualzz/ui-native";
import { useScaledSettingsProfileCardMetrics } from "@utils/accessibilityLayout";
import type { ColorLike } from "@mutualzz/ui-core";
import { observer } from "mobx-react-lite";
import {
  PaletteIcon,
} from "phosphor-react-native";
import { useEffect, useState } from "react";
import ImagePicker from "react-native-image-crop-picker";
import { useTranslation } from "react-i18next";

export const UserProfileSettings = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const primaryIconColor = useSettingsIconColor("primary");
  const account = app.account;
  const embossed = app.settings?.preferEmbossed;
  const cardMetrics = useScaledSettingsProfileCardMetrics();

  const [globalName, setGlobalName] = useState(account?.globalName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setGlobalName(account?.globalName ?? "");
  }, [account?.globalName]);

  if (!account) return null;

  const trimmedName = globalName.trim();
  const hasNameChanges = trimmedName !== (account.globalName ?? "");

  const saveDisplayName = async () => {
    if (!hasNameChanges || savingName || !trimmedName) return;

    setSavingName(true);
    setError(null);

    try {
      const updated = await app.rest.patch<APIPrivateUser>("@me", {
        globalName: trimmedName,
      });
      if (updated) {
        app.setUser(updated);
        app.users.update(updated);
      }
    } catch (e) {
      setError(getErrorMessage(e, t("profile.failedUpdateDisplayName")));
    } finally {
      setSavingName(false);
    }
  };

  const uploadAvatar = () => {
    if (uploadingAvatar) return;

    ImagePicker.openPicker({
      mediaType: "photo",
      cropping: true,
      cropperCircleOverlay: true,
    })
      .then(async (image) => {
        setUploadingAvatar(true);
        setError(null);

        try {
          const formData = new FormData();
          formData.append("avatar", {
            uri: image.path,
            type: image.mime ?? "image/jpeg",
            name: image.filename ?? "avatar.jpg",
          } as unknown as Blob);

          if (image.cropRect) {
            formData.append("crop", JSON.stringify(image.cropRect));
          }

          const updated = await app.rest.patchFormData<APIPrivateUser>(
            "@me",
            formData,
          );

          if (updated) {
            app.setUser(updated);
            app.users.update(updated);
          }
        } catch (e) {
          setError(getErrorMessage(e, t("profile.failedUploadAvatar")));
        } finally {
          setUploadingAvatar(false);
          void ImagePicker.clean();
        }
      })
      .catch(() => undefined)
      .finally(() => {
        void ImagePicker.clean();
      });
  };

  const removeAvatar = async () => {
    if (removingAvatar || !account.avatar) return;

    setRemovingAvatar(true);
    setError(null);

    try {
      const updated = await app.rest.patch<APIPrivateUser>("@me", {
        avatar: null,
      });
      if (updated) {
        app.setUser(updated);
        app.users.update(updated);
      }
    } catch (e) {
      setError(getErrorMessage(e, t("profile.failedRemoveAvatar")));
    } finally {
      setRemovingAvatar(false);
    }
  };

  return (
    <Box style={{ gap: 16 }}>
      <Paper
        style={{
          borderRadius: 12,
          overflow: "hidden",
        }}
        elevation={embossed ? 2 : 0}
      >
        <Paper
          variant="solid"
          color={account.accentColor as ColorLike}
          style={{
            height: cardMetrics.bannerHeight,
            width: "100%",
            borderRadius: 0,
          }}
        />
        <Box
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 12,
            paddingHorizontal: 16,
            paddingBottom: 16,
            marginTop: -cardMetrics.avatarOverlap,
          }}
        >
          <UserAvatar user={account} size={cardMetrics.avatarSize} />
          <Box style={{ flex: 1, minWidth: 0, paddingBottom: 4, gap: 2 }}>
            <Typography level="title-md" weight={700}>
              {account.displayName}
            </Typography>
            <Typography level="body-sm" textColor="muted">
              @{account.username}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper
        variant="soft"
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={embossed ? 2 : 0}
      >
        <Box style={{ gap: 4 }}>
          <Typography level="body-md" weight={700}>
            {t("profile.avatarStudio")}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {t("profile.avatarStudioDescriptionMobile")}
          </Typography>
        </Box>
        <Button
          color="primary"
          disabled={uploadingAvatar}
          onPress={uploadAvatar}
        >
          {uploadingAvatar
            ? t("expressions.uploading")
            : t("profile.uploadAvatar")}
        </Button>
      </Paper>

      <AvatarStudioMethodCards
        embossed={embossed}
        onUpload={uploadAvatar}
        onDraw={() => navigate("/settings/avatar-editor")}
        onAvatars={() => navigate("/settings/avatar-editor")}
      />

      <Button
        disabled={removingAvatar || !account.avatar}
        color="danger"
        size="sm"
        onPress={() => removeAvatar()}
        style={{ alignSelf: "flex-start" }}
      >
        {t("profile.removeCurrentAvatar")}
      </Button>

      <Divider lineColor="muted" style={{ opacity: 0.35 }} />

      <Paper
        variant="soft"
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={embossed ? 2 : 0}
      >
        <Box style={{ gap: 4 }}>
          <Typography level="body-md" weight={700}>
            {t("account.displayName")}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {t("profile.displayNameDescription")}
          </Typography>
        </Box>

        <Input
          value={globalName}
          onChangeText={setGlobalName}
          placeholder={account.username}
          maxLength={32}
        />

        <Box style={{ gap: 4 }}>
          <Typography level="body-xs" textColor="muted">
            {t("account.username")}
          </Typography>
          <Typography level="body-md">@{account.username}</Typography>
        </Box>

        {error && (
          <Typography level="body-sm" color="danger" variant="plain">
            {error}
          </Typography>
        )}

        <Button
          color="primary"
          disabled={!hasNameChanges || !trimmedName || savingName}
          onPress={() => void saveDisplayName()}
        >
          {savingName ? t("profile.saving") : t("profile.saveChanges")}
        </Button>
      </Paper>

      <Divider lineColor="muted" style={{ opacity: 0.35 }} />

      <Paper
        variant="soft"
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={embossed ? 2 : 0}
      >
        <Box style={{ gap: 4 }}>
          <Typography level="body-md" weight={700}>
            {t("profile.profilePage")}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {t("profile.profilePageDescription")}
          </Typography>
        </Box>
        <Button
          color="primary"
          startDecorator={
            <PaletteIcon weight="fill" size={18} color={primaryIconColor} />
          }
          onPress={() => navigate("/settings/profile-editor")}
        >
          {t("profile.customizeProfile")}
        </Button>
      </Paper>
    </Box>
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
