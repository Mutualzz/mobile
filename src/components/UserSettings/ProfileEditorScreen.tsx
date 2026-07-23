import { Button } from "@components/Button";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import {
  SettingsScroll,
  SettingsSection,
} from "@components/UserSettings/SettingsField";
import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import {
  prepareMobileBlocksForSave,
  validateMobileBlocksForSave,
} from "@components/Profile/widgets/editor/profileWidgetEditor.utils";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { ProfileBackgroundLayer } from "@components/Profile/shared/ProfileBackgroundLayer";
import { ProfileBlockImage } from "@components/Profile/shared/ProfileBlockImage";
import { Box, Input, Typography, hasOpenSheets } from "@mutualzz/ui-native";
import type { ColorLike } from "@mutualzz/ui-core";
import { useScaledProfilePreviewHeight } from "@utils/accessibilityLayout";
import { getErrorMessage } from "@utils/errors";
import { pickProfileImageAsset } from "@utils/profileImagePicker";
import ImagePicker from "react-native-image-crop-picker";
import { useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import type { APIMobileProfileBlock, APIProfileMusic } from "@mutualzz/types";
import { expandCustomEmojiShortcodes } from "@utils/markdown/composerQueries";
import { findCustomEmojiByLabel } from "@utils/expressions";
import type { Selection } from "@utils/markdown/types";

const BIO_MAX_LENGTH = 2000;
const PRONOUNS_MAX_LENGTH = 32;

export const ProfileEditorScreen = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const account = app.account;
  const { back, navigate } = useAppNavigation();

  const [bio, setBio] = useState("");
  const [pronouns, setPronouns] = useState("");
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
    pronouns,
    backgroundColor,
    pageFontFamily,
    profileMusic,
    bannerHash,
    mobileBlocks,
  });
  formStateRef.current = {
    bio,
    pronouns,
    backgroundColor,
    pageFontFamily,
    profileMusic,
    bannerHash,
    mobileBlocks,
  };
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const initialMobileBlocksRef = useRef<string | null>(null);

  const handleBack = useCallback(() => {
    const state = formStateRef.current;
    const p = profileRef.current;
    const isDirty =
      !!p &&
      (state.bio !== (p.bio ?? "") ||
        state.pronouns !== (p.pronouns ?? "") ||
        state.backgroundColor !== (p.backgroundColor ?? "") ||
        state.pageFontFamily !== (p.pageFontFamily ?? "") ||
        state.bannerHash !== (p.banner ?? null) ||
        JSON.stringify(state.profileMusic) !==
          JSON.stringify(p.profileMusic ?? null) ||
        JSON.stringify(state.mobileBlocks) !== initialMobileBlocksRef.current);

    if (isDirty) {
      Alert.alert(
        t("profile.editor.leaveTitle"),
        t("profile.editor.leaveDescription"),
        [
          { text: t("profile.editor.keepEditing"), style: "cancel" },
          {
            text: t("profile.editor.leave"),
            style: "destructive",
            onPress: () => back(),
          },
        ],
      );
    } else {
      back();
    }
  }, [back, t]);

  const handleBackRef = useRef(handleBack);
  handleBackRef.current = handleBack;

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (hasOpenSheets()) return false;
        handleBackRef.current();
        return true;
      },
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!profile) return;

    setBio(profile.bio ?? "");
    setPronouns(profile.pronouns ?? "");
    setBackgroundColor(profile.backgroundColor ?? "");
    setPageFontFamily(profile.pageFontFamily ?? "");
    setProfileMusic(profile.profileMusic ?? null);
    setBannerHash(profile.banner ?? null);
    setBannerPreview(profile.constructBannerUrl());
    const nextMobileBlocks = JSON.parse(
      JSON.stringify(profile.mobileBlocks),
    ) as APIMobileProfileBlock[];
    setMobileBlocks(nextMobileBlocks);
    if (initialMobileBlocksRef.current === null) {
      initialMobileBlocksRef.current = JSON.stringify(nextMobileBlocks);
    }
  }, [profile?.updatedAt, profile?.userId]);

  useFocusEffect(
    useCallback(() => {
      if (!account?.id) return;
      const current = app.profiles.get(account.id);
      if (!current) return;
      setMobileBlocks(JSON.parse(JSON.stringify(current.mobileBlocks)));
    }, [account?.id, app.profiles]),
  );

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
        setError(getErrorMessage(e, t("profile.editor.failedUploadBanner")));
      } finally {
        setUploadingBanner(false);
        void ImagePicker.clean();
      }
    } catch (e) {
      setError(getErrorMessage(e, t("profile.editor.failedPickBanner")));
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

      const savedMobileBlocks = prepareMobileBlocksForSave(mobileBlocks);

      await app.profiles.save({
        bio: expandedBio || null,
        pronouns: pronouns.trim() || null,
        banner: bannerHash,
        backgroundColor: backgroundColor.trim() || null,
        backgroundImage: profile.backgroundImage ?? null,
        pageFontFamily: pageFontFamily.trim() || null,
        profileMusic: profileMusic || null,
        blocks: profile.blocks,
        mobileBlocks: savedMobileBlocks,
      });

      initialMobileBlocksRef.current = JSON.stringify(savedMobileBlocks);
    } catch (e) {
      setError(getErrorMessage(e, t("profile.editor.failedSaveProfile")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsScreen
      title={t("profile.editor.mobileTitle")}
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
        <SettingsScroll>
          <Typography level="body-sm" textColor="muted">
            {t("profile.editor.mobileDescription")}
          </Typography>

          <SettingsSection title={t("profile.editor.banner")}>
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
                  {t("profile.editor.noBannerYet")}
                </Typography>
              </Box>
            )}
            <Button
              color="neutral"
              disabled={uploadingBanner}
              onPress={uploadBanner}
            >
              {uploadingBanner
                ? t("expressions.uploading")
                : t("profile.editor.changeBanner")}
            </Button>
          </SettingsSection>

          <SettingsSection title={t("profile.editor.pronouns")}>
            <Input
              value={pronouns}
              onChangeText={(next) =>
                setPronouns(next.slice(0, PRONOUNS_MAX_LENGTH))
              }
              placeholder={t("profile.editor.pronounsPlaceholder")}
            />
          </SettingsSection>

          <SettingsSection title={t("profile.editor.bio")}>
            <MarkdownInput
              value={bio}
              onChange={(next) => setBio(next.slice(0, BIO_MAX_LENGTH))}
              selection={bioSelection}
              onChangeSelection={setBioSelection}
              enableMentions={false}
              enableEmojiAutocomplete
              placeholder={t("profile.editor.bioPlaceholder")}
              elevation={0}
              style={{ minHeight: bioMinHeight }}
            />
          </SettingsSection>

          <SettingsSection title={t("profile.editor.background")}>
            {profile ? (
              <Box
                style={{
                  height: 72,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <ProfileBackgroundLayer
                  profile={profile}
                  backgroundColor={backgroundColor || null}
                />
              </Box>
            ) : null}
            <Input
              type="color"
              value={(backgroundColor || "#1a1a2e") as ColorLike}
              onChange={(color: ColorLike) => setBackgroundColor(String(color))}
              allowGradient
              showRandom
              fullWidth
            />
          </SettingsSection>

          <SettingsSection title={t("profile.editor.pageFont")}>
            <Input
              value={pageFontFamily}
              onChangeText={setPageFontFamily}
              placeholder={t("profile.editor.pageFontPlaceholder")}
              autoCapitalize="none"
            />
          </SettingsSection>

          <SettingsSection title={t("profile.editor.profileMusicUrl")}>
            <Input
              value={profileMusic?.url ?? ""}
              onChangeText={(value) =>
                setProfileMusic({ ...profileMusic, url: value })
              }
              placeholder={t("profile.editor.urlPlaceholder")}
              autoCapitalize="none"
            />
          </SettingsSection>

          <SettingsSection title={t("profile.editor.mobileWidgets")}>
            <Typography level="body-sm" textColor="muted">
              {mobileBlocks.length > 0
                ? t("profile.editor.widgetCount", {
                    count: mobileBlocks.length,
                  })
                : t("profile.editor.noWidgetsYet")}
            </Typography>
            <Button
              color="neutral"
              disabled={!profile}
              onPress={() => navigate("/settings/profile-widgets")}
            >
              {t("profile.editor.editWidgets")}
            </Button>
          </SettingsSection>

          {error ? (
            <Typography level="body-sm" color="danger" variant="plain">
              {error}
            </Typography>
          ) : null}

          <Button
            color="primary"
            disabled={saving || !profile}
            onPress={() => void saveProfile()}
          >
            {saving ? t("profile.saving") : t("profile.editor.saveProfile")}
          </Button>
        </SettingsScroll>
      )}
    </SettingsScreen>
  );
});

