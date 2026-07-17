import { Button } from "@components/Button";
import { Screen } from "@components/Screen/Screen";
import { SpaceSettingsHeader } from "@components/SpaceSettings/SpaceSettingsHeader";
import { useAppStore } from "@hooks/useStores";
import type { APITheme, HttpException } from "@mutualzz/types";
import { baseDarkTheme, baseLightTheme } from "@mutualzz/ui-core";
import { Box, Sheet, Typography, useTheme } from "@mutualzz/ui-native";
import { FULL_SHEET_PROPS } from "@utils/sheet";
import { Theme } from "@stores/objects/Theme";
import { applyAdaptiveThemeValues } from "@utils/adaptation";
import Snowflake from "@utils/Snowflake";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, useColorScheme } from "react-native";
import { ThemeCreatorColorsPage } from "./ThemeCreatorPages/ThemeCreatorColorsPage";
import { ThemeCreatorDetailsPage } from "./ThemeCreatorPages/ThemeCreatorDetailsPage";
import { ThemeCreatorManagePage } from "./ThemeCreatorPages/ThemeCreatorManagePage";

interface Props {
  visible?: boolean;
  onClose: () => void;
  embedded?: boolean;
}

const TABS = [
  { id: "details" },
  { id: "colors" },
  { id: "manage" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export const ThemeCreatorSheet = observer(
  ({ visible = true, onClose, embedded = false }: Props) => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { theme: activeTheme, changeTheme } = useTheme();
  const prefersDark = useColorScheme() === "dark";
  const themeCreator = app.themeCreator;

  const [error, setError] = useState<string | null>(null);

  const { values, currentPage, userInteracted, loadedType, nameEmpty } =
    themeCreator;
  const ownedByUser =
    !!values.id &&
    (app.account?.id === values.authorId ||
      (!!themeCreator.spaceId && values.spaceId === themeCreator.spaceId));
  const existingDraft = app.drafts.existsThemeDraft(values);

  const handlePreview = (enabled: boolean) => {
    if (enabled) {
      themeCreator.startPreview(
        changeTheme,
        Theme.serialize(activeTheme),
        app.account?.id,
      );
      return;
    }

    themeCreator.stopPreview(changeTheme);
  };

  const handleReset = () => {
    themeCreator.resetValues();
    themeCreator.resetFilters();
    setError(null);
  };

  const handleApiError = (e: unknown, fallback: string) => {
    const httpError = e as HttpException;
    if (httpError?.errors?.length) {
      const next: Record<string, string> = {};
      httpError.errors.forEach((entry) => {
        next[entry.path] = entry.message;
      });
      themeCreator.setErrors(next);
      setError(httpError.message ?? fallback);
    } else {
      setError(getErrorMessage(e, fallback));
    }
  };

  const syncBackground = async (themeId: string) => {
    const spaceId = themeCreator.spaceId;
    const base = spaceId
      ? `/spaces/${spaceId}/themes/${themeId}/background`
      : `@me/themes/${themeId}/background`;

    if (themeCreator.pendingBackgroundFile) {
      const formData = new FormData();
      formData.append(
        "backgroundImage",
        themeCreator.pendingBackgroundFile as unknown as Blob,
      );
      const updated = await app.rest.putFormData<APITheme>(base, formData);
      app.themes.add(updated);
      themeCreator.clearPendingBackground();
      return updated;
    }

    if (themeCreator.clearBackgroundImage) {
      const updated = await app.rest.delete<APITheme>(base);
      app.themes.add(updated);
      themeCreator.clearPendingBackground();
      return updated;
    }

    return null;
  };

  const { mutate: publishTheme, isPending: publishing } = useMutation({
    mutationKey: [
      "theme-creator-publish",
      values.name,
      themeCreator.spaceId,
    ],
    mutationFn: async () => {
      const base = values.adaptive
        ? applyAdaptiveThemeValues(values)
        : values;
      const payload = {
        ...Theme.serialize(base),
        id: Snowflake.generate(),
      };

      const spaceId = themeCreator.spaceId;
      let created: APITheme;
      if (spaceId) {
        created = await app.rest.post<APITheme, APITheme>(
          `/spaces/${spaceId}/themes`,
          payload,
        );
      } else {
        created = await app.rest.post<APITheme, APITheme>(
          "@me/themes",
          payload,
        );
      }

      const withBackground = await syncBackground(created.id);
      return withBackground ?? created;
    },
    onSuccess: async (created) => {
      if (!created) return;
      const newTheme = app.themes.add(created);

      const spaceId = themeCreator.spaceId;
      if (spaceId) {
        const space = app.spaces.get(spaceId);
        if (space) {
          const formData = new FormData();
          formData.append("themeId", newTheme.id);
          await app.rest.patchFormData(`/spaces/${spaceId}`, formData);
          space.themeId = newTheme.id;
          space.theme = Theme.serialize(newTheme);
        }
      } else {
        changeTheme(Theme.toEmotion(newTheme));
        app.settings?.setCurrentTheme(newTheme.id);
        app.themes.setCurrentTheme(newTheme.id);
        app.themes.setCurrentType(newTheme.type);
        void app.settings?.sync();
      }

      themeCreator.setErrors({});
      themeCreator.setLoadedType("custom");
      themeCreator.loadValues(created);
      themeCreator.stopPreview(changeTheme);
      setError(null);
    },
    onError: (e) => handleApiError(e, t("themeCreator.errors.publishFailed")),
  });

  const { mutate: updateTheme, isPending: updating } = useMutation({
    mutationKey: ["theme-creator-update", values.id, themeCreator.spaceId],
    mutationFn: async () => {
      const payload = Theme.serialize(
        values.adaptive ? applyAdaptiveThemeValues(values) : values,
      );

      const spaceId = themeCreator.spaceId;
      let updated: APITheme;
      if (spaceId) {
        updated = await app.rest.patch<APITheme, APITheme>(
          `/spaces/${spaceId}/themes/${values.id}`,
          payload,
        );
      } else {
        updated = await app.rest.patch<APITheme, APITheme>(
          `@me/themes/${values.id}`,
          payload,
        );
      }

      const withBackground = await syncBackground(updated.id);
      return withBackground ?? updated;
    },
    onSuccess: (updated) => {
      if (!updated) return;
      app.themes.update(updated);

      const spaceId = themeCreator.spaceId;
      if (spaceId) {
        const space = app.spaces.get(spaceId);
        if (space?.themeId === updated.id) {
          space.theme = updated;
        }
      } else if (app.settings?.currentTheme === updated.id) {
        changeTheme(Theme.toEmotion(updated));
      }

      themeCreator.setErrors({});
      themeCreator.loadValues(updated);
      setError(null);
    },
    onError: (e) => handleApiError(e, t("themeCreator.errors.updateFailed")),
  });

  const { mutate: deleteTheme, isPending: deleting } = useMutation({
    mutationKey: ["theme-creator-delete", values.id, themeCreator.spaceId],
    mutationFn: async () => {
      if (!values.id) return null;

      const spaceId = themeCreator.spaceId;
      if (spaceId) {
        return app.rest.delete<{ id: string }>(
          `/spaces/${spaceId}/themes/${values.id}`,
        );
      }

      return app.rest.delete<{ id: string }>(`@me/themes/${values.id}`);
    },
    onSuccess: (result) => {
      if (!result) return;

      const deletingCurrent = activeTheme.id === result.id;
      const spaceId = themeCreator.spaceId;

      app.themes.remove(result.id);

      if (spaceId) {
        const space = app.spaces.get(spaceId);
        if (space?.themeId === result.id) {
          space.themeId = null;
          space.theme = null;
        }
        themeCreator.resetToBaseTheme();
        return;
      }

      const remainingCustom = app.themes.all.filter(
        (t) => t.authorId && !t.spaceId,
      );
      const fallback = prefersDark ? baseDarkTheme : baseLightTheme;

      if (remainingCustom.length === 0) {
        themeCreator.resetValues();
        themeCreator.resetFilters();
        changeTheme(Theme.toEmotion(fallback));
      } else if (deletingCurrent) {
        app.settings?.setCurrentTheme(fallback.id);
        app.themes.setCurrentTheme(fallback.id);
        changeTheme(Theme.toEmotion(fallback));
      }

      themeCreator.resetToBaseTheme();
    },
    onError: (e) => handleApiError(e, t("themeCreator.errors.deleteFailed")),
  });
  const handleSaveDraft = () => {
    if (existingDraft) app.drafts.updateThemeDraft(values);
    else app.drafts.saveThemeDraft(values);
  };

  const setTab = (id: TabId) => themeCreator.setCurrentPage(id);

  const body = (
      <Screen
        fill
        keyboard="form"
        safeTop={false}
        style={{ backgroundColor: activeTheme.colors.background }}
      >
        <SpaceSettingsHeader title={t("themeCreator.title")} onClose={onClose} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 20,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 4}}
        >
          {TABS.map(({ id }) => (
            <ThemeCreatorTab
              key={id}
              label={t(`themeCreator.tabs.${id}`)}
              active={currentPage === id}
              onPress={() => setTab(id)}
            />
          ))}
        </ScrollView>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 16}}
          keyboardShouldPersistTaps="handled"
        >
          {currentPage === "details" && <ThemeCreatorDetailsPage />}
          {currentPage === "colors" && <ThemeCreatorColorsPage />}
          {currentPage === "manage" && (
            <ThemeCreatorManagePage
              onDeleteTheme={() => deleteTheme()}
              deletingTheme={deleting}
            />
          )}
        </ScrollView>

        <Box
          style={{
            gap: 8,
            paddingHorizontal: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: `${activeTheme.typography.colors.muted}24`}}
        >
          {error && (
            <Typography level="body-sm" color="danger" variant="plain">
              {error}
            </Typography>
          )}

          <Box style={{ flexDirection: "row", gap: 8 }}>
            <Button
              expand
              variant="soft"
              disabled={
                loadedType === "default" || ownedByUser || !userInteracted
              }
              onPress={() => handlePreview(!themeCreator.inPreview)}
            >
              {themeCreator.inPreview
                ? t("themeCreator.preview.stopButton")
                : t("themeCreator.preview.preview")}
            </Button>
            <Button
              expand
              color="success"
              disabled={!userInteracted || nameEmpty || publishing || updating}
              onPress={() => (ownedByUser ? updateTheme() : publishTheme())}
            >
              {publishing || updating
                ? t("profile.saving")
                : ownedByUser
                  ? t("themeCreator.actions.update")
                  : t("themeCreator.actions.publish")}
            </Button>
          </Box>

          <Box
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 16}}
          >
            <Button
              variant="plain"
              disabled={!userInteracted || themeCreator.inPreview}
              onPress={handleReset}
            >
              {t("themeCreator.actions.reset")}
            </Button>
            <Button
              variant="plain"
              color="warning"
              disabled={!userInteracted || nameEmpty || ownedByUser}
              onPress={handleSaveDraft}
            >
              {existingDraft
                ? t("themeCreator.actions.updateDraftLower")
                : t("themeCreator.actions.saveDraftLower")}
            </Button>
          </Box>
        </Box>
      </Screen>
  );

  if (embedded) return body;

  return (
    <Sheet open={visible} onClose={onClose} {...FULL_SHEET_PROPS}>
      {body}
    </Sheet>
  );
});

interface ThemeCreatorTabProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const ThemeCreatorTab = ({
  label,
  active,
  onPress}: ThemeCreatorTabProps) => {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress} style={{ gap: 6 }}>
      <Typography
        level="body-sm"
        weight={active ? 700 : 400}
        style={{
          color: active
            ? theme.colors.primary
            : theme.typography.colors.muted}}
      >
        {label}
      </Typography>
      <Box
        style={{
          height: 2,
          borderRadius: 1,
          backgroundColor: active ? theme.colors.primary : "transparent"}}
      />
    </Pressable>
  );
};

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
