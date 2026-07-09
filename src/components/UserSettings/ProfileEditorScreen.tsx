import { Button } from "@components/Button";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { Paper } from "@components/Paper";
import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { ProfileWidgetEditorModal } from "@components/Profile/widgets/editor/ProfileWidgetEditorModal";
import {
  prepareMobileBlocksForSave,
  validateMobileBlocksForSave,
} from "@components/Profile/widgets/editor/profileWidgetEditor.utils";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, Input, Typography, hasOpenModals } from "@mutualzz/ui-native";
import { ProfileBlockImage } from "@components/Profile/shared/ProfileBlockImage";
import { useScaledProfilePreviewHeight } from "@utils/accessibilityLayout";
import { pickProfileImageAsset } from "@utils/profileImagePicker";
import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
} from "react-native";
import type { APIMobileProfileBlock, APIProfileMusic } from "@mutualzz/types";
import { expandCustomEmojiShortcodes } from "@utils/markdown/composerQueries";
import { findCustomEmojiByLabel } from "@utils/expressions";
import type { Selection } from "@utils/markdown/types";

const BIO_MAX_LENGTH = 2000;

export const ProfileEditorScreen = observer(() => {
  const app = useAppStore();
  const account = app.account;
  const { back } = useAppNavigation();

  const [bio, setBio] = useState("");
  const [bioSelection, setBioSelection] = useState<Selection>({
    start: 0,
    end: 0,
  });
  const [backgroundColor, setBackgroundColor] = useState("");
  const [pageFontFamily, setPageFontFamily] = useState("");
  const [profileMusic, setProfileMusic] = useState<APIProfileMusic | null>(
    null,
  );
  const [bannerHash, setBannerHash] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerPreviewHeight = useScaledProfilePreviewHeight(120);
  const bioMinHeight = useScaledProfilePreviewHeight(120);
  const [mobileBlocks, setMobileBlocks] = useState<APIMobileProfileBlock[]>([]);
  const [widgetEditorOpen, setWidgetEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: fetchedProfile, isLoading } = useQuery({
    queryKey: ["profile-editor", account?.id],
    enabled: !!account?.id,
    queryFn: () => app.profiles.resolve(account!.id, true),
  });

  const profile = account?.id
    ? (app.profiles.get(account.id) ?? fetchedProfile)
    : undefined;

  const formStateRef = useRef({
    bio,
    backgroundColor,
    pageFontFamily,
    profileMusic,
    bannerHash,
    mobileBlocks,
  });
  formStateRef.current = {
    bio,
    backgroundColor,
    pageFontFamily,
    profileMusic,
    bannerHash,
    mobileBlocks,
  };
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const handleBack = useCallback(() => {
    const state = formStateRef.current;
    const p = profileRef.current;
    const isDirty =
      !!p &&
      (state.bio !== (p.bio ?? "") ||
        state.backgroundColor !== (p.backgroundColor ?? "") ||
        state.pageFontFamily !== (p.pageFontFamily ?? "") ||
        state.bannerHash !== (p.banner ?? null) ||
        JSON.stringify(state.profileMusic) !==
          JSON.stringify(p.profileMusic ?? null) ||
        JSON.stringify(state.mobileBlocks) !== JSON.stringify(p.mobileBlocks));

    if (isDirty) {
      Alert.alert(
        "Leave without saving?",
        "You have unsaved changes. If you leave now, your changes will be lost.",
        [
          { text: "Keep editing", style: "cancel" },
          { text: "Leave", style: "destructive", onPress: () => back() },
        ],
      );
    } else {
      back();
    }
  }, [back]);

  const handleBackRef = useRef(handleBack);
  handleBackRef.current = handleBack;

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (hasOpenModals()) return false;
        handleBackRef.current();
        return true;
      },
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!profile) return;

    setBio(profile.bio ?? "");
    setBackgroundColor(profile.backgroundColor ?? "");
    setPageFontFamily(profile.pageFontFamily ?? "");
    setProfileMusic(profile.profileMusic ?? null);
    setBannerHash(profile.banner ?? null);
    setBannerPreview(profile.constructBannerUrl());
    setMobileBlocks(JSON.parse(JSON.stringify(profile.mobileBlocks)));
  }, [profile?.updatedAt, profile?.userId]);

  if (!account) return null;

  const uploadBanner = async () => {
    if (uploadingBanner) return;

    try {
      const image = await pickProfileImageAsset({
        cropWidth: 1200,
        cropHeight: 400,
      });
      if (!image) return;

      setUploadingBanner(true);
      setError(null);

      try {
        const result = await app.profiles.uploadAsset("banner", {
          uri: image.path,
          type: image.mime,
          name: image.name,
        });

        setBannerHash(result.hash);
        setBannerPreview(image.path);
      } catch (e) {
        setError(getErrorMessage(e, "Failed to upload banner"));
      } finally {
        setUploadingBanner(false);
      }
    } catch (e) {
      setError(getErrorMessage(e, "Failed to pick banner image"));
    }
  };

  const saveProfile = async () => {
    if (saving || !profile) return;

    const mobileBlocksError = validateMobileBlocksForSave(mobileBlocks);
    if (mobileBlocksError) {
      setError(mobileBlocksError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const expandedBio = expandCustomEmojiShortcodes(bio.trim(), (name) =>
        findCustomEmojiByLabel(app.expressions.all, name, account.id),
      );

      await app.profiles.save({
        bio: expandedBio || null,
        banner: bannerHash,
        backgroundColor: backgroundColor.trim() || null,
        backgroundImage: profile.backgroundImage ?? null,
        pageFontFamily: pageFontFamily.trim() || null,
        profileMusic: profileMusic || null,
        blocks: profile.blocks,
        mobileBlocks: prepareMobileBlocksForSave(mobileBlocks),
      });
    } catch (e) {
      setError(getErrorMessage(e, "Failed to save profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsScreen
      title="Profile Editor"
      onBack={handleBack}
      contentStyle={{ flex: 1 }}
    >
      {isLoading && !profile ? (
        <Box
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator />
        </Box>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 32,
            gap: 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Typography level="body-sm" textColor="muted">
            Edit your profile page content and block layout.
          </Typography>

          <Paper
            style={{
              borderRadius: 12,
              overflow: "hidden",
              gap: 12,
              padding: 12,
            }}
            elevation={app.settings?.preferEmbossed ? 2 : 0}
          >
            <Typography level="body-md" weight={700}>
              Banner
            </Typography>
            {bannerPreview ? (
              <ProfileBlockImage
                uri={bannerPreview}
                assetHash={bannerHash}
                style={{
                  width: "100%",
                  height: bannerPreviewHeight,
                  borderRadius: 8,
                }}
                resizeMode="cover"
              />
            ) : (
              <Box
                style={{
                  height: bannerPreviewHeight,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(127,127,127,0.15)",
                }}
              >
                <Typography level="body-sm" textColor="muted">
                  No banner yet
                </Typography>
              </Box>
            )}
            <Button
              color="neutral"
              disabled={uploadingBanner}
              onPress={uploadBanner}
            >
              {uploadingBanner ? "Uploading..." : "Change Banner"}
            </Button>
          </Paper>

          <Paper
            style={{
              borderRadius: 12,
              padding: 12,
              gap: 12,
            }}
            elevation={app.settings?.preferEmbossed ? 2 : 0}
          >
            <Typography level="body-md" weight={700}>
              Bio
            </Typography>
            <MarkdownInput
              value={bio}
              onChange={(next) => setBio(next.slice(0, BIO_MAX_LENGTH))}
              selection={bioSelection}
              onChangeSelection={setBioSelection}
              enableMentions={false}
              enableEmojiAutocomplete
              placeholder="Tell people about yourself"
              elevation={0}
              style={{ minHeight: bioMinHeight }}
            />
          </Paper>

          <Paper
            style={{
              borderRadius: 12,
              padding: 12,
              gap: 12,
            }}
            elevation={app.settings?.preferEmbossed ? 2 : 0}
          >
            <Typography level="body-md" weight={700}>
              Background color
            </Typography>
            <Input
              value={backgroundColor}
              onChangeText={setBackgroundColor}
              placeholder="#1a1a1a"
              autoCapitalize="none"
            />
          </Paper>

          <Paper
            style={{
              borderRadius: 12,
              padding: 12,
              gap: 12,
            }}
            elevation={app.settings?.preferEmbossed ? 2 : 0}
          >
            <Typography level="body-md" weight={700}>
              Page font
            </Typography>
            <Input
              value={pageFontFamily}
              onChangeText={setPageFontFamily}
              placeholder="Inter, Rubik, etc."
              autoCapitalize="none"
            />
          </Paper>

          <Paper
            style={{
              borderRadius: 12,
              padding: 12,
              gap: 12,
            }}
            elevation={app.settings?.preferEmbossed ? 2 : 0}
          >
            <Typography level="body-md" weight={700}>
              Profile music URL
            </Typography>
            <Input
              value={profileMusic?.url ?? ""}
              onChangeText={(value) =>
                setProfileMusic({ ...profileMusic, url: value })
              }
              placeholder="https://..."
              autoCapitalize="none"
            />
          </Paper>

          <Paper
            style={{
              borderRadius: 12,
              padding: 12,
              gap: 12,
              overflow: "hidden",
            }}
            elevation={app.settings?.preferEmbossed ? 2 : 0}
          >
            <Typography level="body-md" weight={700}>
              Mobile Widgets
            </Typography>
            <Typography level="body-sm" textColor="muted">
              {mobileBlocks.length > 0
                ? `${mobileBlocks.length} widget${mobileBlocks.length === 1 ? "" : "s"} on your mobile profile.`
                : "No widgets yet."}
            </Typography>
            <Button
              color="neutral"
              disabled={!profile}
              onPress={() => setWidgetEditorOpen(true)}
            >
              Edit Widgets
            </Button>
          </Paper>

          {error && (
            <Typography level="body-sm" color="danger" variant="plain">
              {error}
            </Typography>
          )}

          <Button
            color="primary"
            disabled={saving || !profile}
            onPress={() => void saveProfile()}
          >
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </ScrollView>
      )}

      {profile && (
        <ProfileWidgetEditorModal
          visible={widgetEditorOpen}
          onClose={() => setWidgetEditorOpen(false)}
          profile={profile}
          user={account}
          mobileBlocks={mobileBlocks}
          onMobileBlocksChange={setMobileBlocks}
          desktopBlocks={profile.blocks}
          onSave={() => void saveProfile()}
          saving={saving}
          error={error}
        />
      )}
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
