import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import {
  SectionHeader,
  ThemeGrid,
  ThemeSwatch,
} from "@components/Theme/ThemePicker";
import { ThemeCreatorSheet } from "@components/UserSettings/ThemeCreatorSheet";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import type { APITheme } from "@mutualzz/types";
import { baseDarkTheme, baseLightTheme } from "@mutualzz/ui-core";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import type { Theme as StoreTheme } from "@stores/objects/Theme";
import { getThemeSwatchStops } from "@utils/themeSwatch";
import { FULL_SHEET_PROPS } from "@utils/sheet";
import { useMutation, useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { PaletteIcon } from "phosphor-react-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

interface Props {
  space: Space;
}

export const SpaceThemeSettings = observer(({ space }: Props) => {
  const { t } = useTranslation("space");
  const { t: tSettings } = useTranslation("settings");
  const app = useAppStore();
  const { openSheet, closeSheet } = useSheet();

  const { data: spaceThemes = [], refetch } = useQuery({
    queryKey: ["space-themes", space.id],
    queryFn: () => app.rest.get<APITheme[]>(`/spaces/${space.id}/themes`),
    enabled: !!space.id,
  });

  useEffect(() => {
    if (spaceThemes.length) app.themes.addAll(spaceThemes);
  }, [spaceThemes, app.themes]);

  const { mutate: setThemeId, isPending } = useMutation({
    mutationFn: async (themeId: string | null) => {
      const formData = new FormData();
      formData.append("themeId", themeId ?? "");
      return app.rest.patchFormData<{
        id: string;
        themeId?: string | null;
        theme?: APITheme | null;
      }>(`/spaces/${space.id}`, formData);
    },
    onSuccess: (data) => {
      space.themeId = data.themeId ?? null;
      space.theme = data.theme ?? null;
      if (data.theme) app.themes.add(data.theme);
      void refetch();
    },
  });

  const defaultThemes = [baseDarkTheme, baseLightTheme];

  const defaultColorThemes = app.themes.all
    .filter((theme) => !theme.author && !theme.spaceId)
    .filter((theme) => theme.id !== "baseDark" && theme.id !== "baseLight");

  const normalThemes = defaultColorThemes.filter(
    (theme) => theme.style === "normal",
  );

  const gradientThemes = defaultColorThemes.filter(
    (theme) => theme.style === "gradient",
  );

  const customThemes = app.themes.all.filter(
    (theme) => theme.spaceId === space.id,
  );

  const activeId = space.themeId ?? null;

  const isSelected = (theme: StoreTheme | typeof baseDarkTheme) =>
    theme.id === activeId;

  const handleSelect = (theme: StoreTheme | typeof baseDarkTheme) => {
    if (theme.id === activeId || isPending) return;
    setThemeId(theme.id);
  };

  const openThemeCreator = () => {
    app.themeCreator.setSpaceId(space.id);
    app.themeCreator.resetToBaseTheme();
    openSheet(
      "theme-creator",
      <ThemeCreatorSheet
        embedded
        onClose={() => closeSheet("theme-creator")}
      />,
      FULL_SHEET_PROPS,
    );
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 32,
        gap: 16,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 12,
          minWidth: 0,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Box
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Typography level="body-sm" textColor="muted" style={{ flex: 1 }}>
            {t("theme.description")}
          </Typography>
          <Box style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Button
              size="sm"
              variant="soft"
              disabled={isPending || !activeId}
              onPress={() => setThemeId(null)}
            >
              {t("theme.clear")}
            </Button>
            <IconButton
              padding={6}
              size={16}
              variant="soft"
              onPress={openThemeCreator}
            >
              <PaletteIcon weight="fill" />
            </IconButton>
          </Box>
        </Box>

        <SectionHeader title={tSettings("appearance.defaultThemes")} />
        <Box
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            paddingVertical: 8,
          }}
        >
          {defaultThemes.map((theme) => (
            <ThemeSwatch
              key={theme.id}
              stops={getThemeSwatchStops(
                theme.colors.background,
                theme.colors.primary,
              )}
              selected={isSelected(theme)}
              onPress={() => handleSelect(theme)}
            />
          ))}
        </Box>

        {normalThemes.length > 0 && (
          <>
            <SectionHeader title={tSettings("appearance.normal")} />
            <ThemeGrid
              themes={normalThemes}
              isSelected={isSelected}
              onSelect={handleSelect}
            />
          </>
        )}

        {gradientThemes.length > 0 && (
          <>
            <SectionHeader title={tSettings("appearance.gradient")} />
            <ThemeGrid
              themes={gradientThemes}
              isSelected={isSelected}
              onSelect={handleSelect}
            />
          </>
        )}

        <SectionHeader title={t("theme.spaceThemes")} />
        {customThemes.length === 0 ? (
          <Typography level="body-sm" textColor="muted">
            {t("theme.noCustomThemes")}
          </Typography>
        ) : (
          <ThemeGrid
            themes={customThemes}
            isSelected={isSelected}
            onSelect={handleSelect}
          />
        )}
      </Paper>
    </ScrollView>
  );
});
