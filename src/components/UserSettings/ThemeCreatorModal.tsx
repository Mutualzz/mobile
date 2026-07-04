import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import type { APITheme, HttpException } from "@mutualzz/types";
import { baseDarkTheme, baseLightTheme } from "@mutualzz/ui-core";
import { Box, IconButton, Switch, Typography, useTheme } from "@mutualzz/ui-native";
import { Theme } from "@stores/objects/Theme";
import { applyAdaptiveThemeValues } from "@utils/adaptation";
import Snowflake from "@utils/Snowflake";
import { useMutation } from "@tanstack/react-query";
import {
  GearIcon,
  PaletteIcon,
  TextAaIcon,
  TextAlignJustifyIcon,
  WarningIcon,
  XIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Modal, Pressable, ScrollView, useColorScheme } from "react-native";
import { ThemeCreatorAdaptivePage } from "./ThemeCreatorPages/ThemeCreatorAdaptivePage";
import { ThemeCreatorBasePage } from "./ThemeCreatorPages/ThemeCreatorBasePage";
import { ThemeCreatorDetailsPage } from "./ThemeCreatorPages/ThemeCreatorDetailsPage";
import { ThemeCreatorFeedbackPage } from "./ThemeCreatorPages/ThemeCreatorFeedbackPage";
import { ThemeCreatorManagePage } from "./ThemeCreatorPages/ThemeCreatorManagePage";
import { ThemeCreatorTypographyPage } from "./ThemeCreatorPages/ThemeCreatorTypographyPage";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const NON_ADAPTIVE_TABS = [
  { id: "details", label: "Details", Icon: TextAlignJustifyIcon },
  { id: "base", label: "Base", Icon: PaletteIcon },
  { id: "feedback", label: "Feedback", Icon: WarningIcon },
  { id: "typography", label: "Typography", Icon: TextAaIcon },
  { id: "manage", label: "Manage", Icon: GearIcon },
] as const;

const ADAPTIVE_TABS = [
  { id: "details", label: "Details", Icon: TextAlignJustifyIcon },
  { id: "adaptive", label: "Adaptive", Icon: PaletteIcon },
  { id: "manage", label: "Manage", Icon: GearIcon },
] as const;

export const ThemeCreatorModal = observer(({ visible, onClose }: Props) => {
  const app = useAppStore();
  const { theme: activeTheme, changeTheme } = useTheme();
  const prefersDark = useColorScheme() === "dark";
  const themeCreator = app.themeCreator;

  const [error, setError] = useState<string | null>(null);

  const { values, currentPage, userInteracted, loadedType, nameEmpty } = themeCreator;
  const tabs = values.adaptive ? ADAPTIVE_TABS : NON_ADAPTIVE_TABS;
  const ownedByUser = !!values.id && app.account?.id === values.authorId;
  const existingDraft = app.drafts.existsThemeDraft(values);

  const handleAdaptiveToggle = (checked: boolean) => {
    themeCreator.setValues({ adaptive: checked });
    themeCreator.setCurrentPage("details");
  };

  const handlePreview = (enabled: boolean) => {
    if (enabled) {
      themeCreator.startPreview(changeTheme, Theme.serialize(activeTheme));
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

  const { mutate: publishTheme, isPending: publishing } = useMutation({
    mutationKey: ["theme-creator-publish", values.name],
    mutationFn: async () => {
      let payload = { ...values, id: Snowflake.generate() };
      if (values.adaptive) {
        payload = { ...applyAdaptiveThemeValues(values), id: Snowflake.generate() };
      }
      return app.rest.post<APITheme, APITheme>("@me/themes", payload);
    },
    onSuccess: (created) => {
      if (!created) return;
      const newTheme = app.themes.add(created);
      changeTheme(Theme.toEmotion(newTheme));
      app.settings?.setCurrentTheme(newTheme.id);
      app.themes.setCurrentTheme(newTheme.id);
      app.themes.setCurrentType(newTheme.type);
      void app.settings?.sync();

      themeCreator.setErrors({});
      themeCreator.setLoadedType("custom");
      themeCreator.loadValues(created);
      themeCreator.stopPreview(changeTheme);
      setError(null);
    },
    onError: (e) => handleApiError(e, "Failed to publish theme"),
  });

  const { mutate: updateTheme, isPending: updating } = useMutation({
    mutationKey: ["theme-creator-update", values.id],
    mutationFn: async () => {
      const payload = values.adaptive ? applyAdaptiveThemeValues(values) : values;
      return app.rest.patch<APITheme, APITheme>(`@me/themes/${values.id}`, payload);
    },
    onSuccess: (updated) => {
      if (!updated) return;
      app.themes.update(updated);
      if (app.settings?.currentTheme === updated.id) changeTheme(Theme.toEmotion(updated));
      themeCreator.setErrors({});
      setError(null);
    },
    onError: (e) => handleApiError(e, "Failed to update theme"),
  });

  const { mutate: deleteTheme, isPending: deleting } = useMutation({
    mutationKey: ["theme-creator-delete", values.id],
    mutationFn: async () => {
      if (!values.id) return null;
      return app.rest.delete<{ id: string }>(`@me/themes/${values.id}`);
    },
    onSuccess: (result) => {
      if (!result) return;

      const deletingCurrent = activeTheme.id === result.id;
      app.themes.remove(result.id);

      const remainingCustom = app.themes.all.filter((t) => t.authorId);
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
    },
    onError: (e) => handleApiError(e, "Failed to delete theme"),
  });

  const handleSaveDraft = () => {
    if (existingDraft) app.drafts.updateThemeDraft(values);
    else app.drafts.saveThemeDraft(values);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Box
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.45)",
        }}
      >
        <Paper
          style={{
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 20,
            gap: 12,
            maxHeight: "88%",
          }}
          elevation={app.settings?.preferEmbossed ? 4 : 2}
        >
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography level="body-lg" weight="bold">
              Theme Creator
            </Typography>
            <IconButton
              variant="plain"
              color="neutral"
              padding={4}
              accessibilityLabel="Close"
              onPress={onClose}
            >
              <XIcon size={18} />
            </IconButton>
          </Box>

          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Box style={{ flex: 1, gap: 2 }}>
              <Typography level="body-sm" weight={700}>
                Adaptive theme
              </Typography>
              <Typography level="body-xs" textColor="muted">
                Derive surface and text colors automatically
              </Typography>
            </Box>
            <Switch checked={values.adaptive} onChange={handleAdaptiveToggle} />
          </Box>

          <Box style={{ flexDirection: "row", gap: 4, flexWrap: "wrap" }}>
            {tabs.map(({ id, label, Icon }) => (
              <ThemeCreatorTab
                key={id}
                label={label}
                Icon={Icon}
                active={currentPage === id}
                onPress={() => themeCreator.setCurrentPage(id)}
              />
            ))}
          </Box>

          <ScrollView
            contentContainerStyle={{ paddingVertical: 16, gap: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {currentPage === "details" && <ThemeCreatorDetailsPage />}
            {!values.adaptive && currentPage === "base" && <ThemeCreatorBasePage />}
            {!values.adaptive && currentPage === "feedback" && <ThemeCreatorFeedbackPage />}
            {!values.adaptive && currentPage === "typography" && <ThemeCreatorTypographyPage />}
            {values.adaptive && currentPage === "adaptive" && <ThemeCreatorAdaptivePage />}
            {currentPage === "manage" && (
              <ThemeCreatorManagePage
                onDeleteTheme={() => deleteTheme()}
                deletingTheme={deleting}
              />
            )}
          </ScrollView>

          <Box style={{ flexDirection: "row", gap: 8 }}>
            <Button
              variant="soft"
              color="danger"
              style={{ flex: 1 }}
              disabled={!userInteracted || themeCreator.inPreview}
              onPress={handleReset}
            >
              Reset
            </Button>
            <Button
              variant="soft"
              style={{ flex: 1 }}
              disabled={loadedType === "default" || ownedByUser || !userInteracted}
              onPress={() => handlePreview(!themeCreator.inPreview)}
            >
              {themeCreator.inPreview ? "Stop Preview" : "Preview"}
            </Button>
          </Box>

          {error && (
            <Typography level="body-sm" style={{ color: "#e74c3c" }}>
              {error}
            </Typography>
          )}

          <Box style={{ flexDirection: "row", gap: 8 }}>
            <Button
              color="warning"
              style={{ flex: 1 }}
              disabled={!userInteracted || nameEmpty || ownedByUser}
              onPress={handleSaveDraft}
            >
              {existingDraft ? "Update Draft" : "Save Draft"}
            </Button>
            <Button
              color="success"
              style={{ flex: 1 }}
              disabled={!userInteracted || nameEmpty || publishing || updating}
              onPress={() => (ownedByUser ? updateTheme() : publishTheme())}
            >
              {publishing || updating
                ? "Saving..."
                : ownedByUser
                  ? "Update"
                  : "Publish"}
            </Button>
          </Box>
          <Button variant="plain" onPress={onClose}>
            Close
          </Button>
        </Paper>
      </Box>
    </Modal>
  );
});

interface ThemeCreatorTabProps {
  label: string;
  Icon: typeof PaletteIcon;
  active: boolean;
  onPress: () => void;
}

const ThemeCreatorTab = ({ label, Icon, active, onPress }: ThemeCreatorTabProps) => {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 70,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingVertical: 8,
        borderRadius: 8,
        borderBottomWidth: 2,
        borderBottomColor: active ? theme.colors.primary : "transparent",
        backgroundColor: active ? `${theme.colors.primary}14` : "transparent",
      }}
    >
      <Icon
        size={16}
        color={active ? theme.colors.primary : theme.typography.colors.muted}
        weight="fill"
      />
      <Typography
        level="body-xs"
        weight={active ? "bold" : undefined}
        style={{
          color: active ? theme.colors.primary : theme.typography.colors.muted,
        }}
      >
        {label}
      </Typography>
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
