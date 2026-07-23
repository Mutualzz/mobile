import { ThemeCreatorSheet } from "@components/UserSettings/ThemeCreatorSheet";
import { AppAppearanceExtrasSettings } from "@components/UserSettings/AppAppearanceExtrasSettings";
import { AdaptiveIconSwatch } from "@components/UserSettings/AdaptiveIconSwatch";
import {
  SectionHeader,
  ThemeGrid,
  ThemeSwatch,
} from "@components/Theme/ThemePicker";
import {
  SettingsScroll,
  SettingsSection,
  SettingsSelectRow,
  SettingsToggleRow,
} from "@components/UserSettings/SettingsField";
import { useSettingsOptionSheet } from "@hooks/useSettingsOptionSheet";
import { Paper } from "@components/Paper";
import { IconButton } from "@components/IconButton";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import {
  type AppLocale,
  localeNativeNames,
  supportedLocales,
} from "@mutualzz/i18n";
import {
  CheckIcon,
  PaletteIcon,
  RepeatIcon,
  TrashIcon,
} from "phosphor-react-native";
import { baseDarkTheme, baseLightTheme, type ColorLike } from "@mutualzz/ui-core";
import { Box, Divider, Typography, useTheme } from "@mutualzz/ui-native";
import type { Theme as StoreTheme } from "@stores/objects/Theme";
import { Theme } from "@stores/objects/Theme";
import { getPreferredLocale, setPreferredLocale } from "../../i18n";
import { getThemeSwatchStops, type ThemeSwatchStop } from "@utils/themeSwatch";
import {
  useScaledSquareSize,
  useScaledThemeSwatchSize,
} from "@utils/accessibilityLayout";
import { FULL_SHEET_PROPS } from "@utils/sheet";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useColorScheme, Pressable, View } from "react-native";

const LANGUAGE_PICKER_SHEET_ID = "language-picker";
const SWATCH_SIZE = 64;

const SelectionBadge = ({
  badgeIcon = "check",
}: {
  badgeIcon?: "check" | "sync";
}) => {
  const { theme } = useTheme();
  const badgeSize = useScaledSquareSize(24);

  return (
    <View
      style={{
        position: "absolute",
        top: -1,
        right: -2,
        width: badgeSize,
        height: badgeSize,
        borderRadius: badgeSize / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: theme.colors.surface,
      }}
    >
      {badgeIcon === "sync" ? (
        <RepeatIcon size={14} color={theme.typography.colors.primary} />
      ) : (
        <CheckIcon size={14} color={theme.typography.colors.primary} />
      )}
    </View>
  );
};

const IconSwatch = ({
  primaryColor,
  selected,
  onPress,
  badgeIcon = "check",
  alwaysShowBadge = false,
}: {
  primaryColor: ColorLike;
  selected: boolean;
  onPress: () => void;
  badgeIcon?: "check" | "sync";
  alwaysShowBadge?: boolean;
}) => {
  const { theme } = useTheme();
  const swatchSize = useScaledThemeSwatchSize(SWATCH_SIZE);
  const showBadge = alwaysShowBadge || selected;
  const outline = 3;

  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 4 }}>
      <View
        style={{
          position: "relative",
          width: swatchSize,
          height: swatchSize,
        }}
      >
        {selected && (
          <View
            style={{
              position: "absolute",
              top: -outline,
              left: -outline,
              width: swatchSize + outline * 2,
              height: swatchSize + outline * 2,
              borderRadius: (swatchSize + outline * 2) / 2,
              borderWidth: outline,
              borderColor: theme.colors.primary,
            }}
          />
        )}
        <AdaptiveIconSwatch primaryColor={primaryColor} />
        {showBadge && <SelectionBadge badgeIcon={badgeIcon} />}
      </View>
    </Pressable>
  );
};

export const AppAppearanceSettings = observer(() => {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const app = useAppStore();
  const settings = app.settings;
  const { theme: currentTheme, changeTheme, type: currentType } = useTheme();
  const prefersDark = useColorScheme() === "dark";
  const { openSheet, closeSheet } = useSheet();
  const openPicker = useSettingsOptionSheet();
  const [deletingThemeId, setDeletingThemeId] = useState<string | null>(null);
  const [preferredLocale, setPreferredLocaleState] = useState<
    AppLocale | "system"
  >("system");

  useEffect(() => {
    void getPreferredLocale().then((locale) => {
      setPreferredLocaleState(locale ?? "system");
    });
  }, []);

  const selectLocale = (locale: AppLocale | "system") => {
    setPreferredLocaleState(locale);
    void setPreferredLocale(locale);
  };

  const selectedLocaleLabel =
    preferredLocale === "system"
      ? tCommon("language.systemDefault")
      : localeNativeNames[preferredLocale];

  const languageOptions: { value: string; label: string }[] = [
    { value: "system", label: tCommon("language.systemDefault") },
    ...supportedLocales.map((locale) => ({
      value: locale,
      label: localeNativeNames[locale],
    })),
  ];

  const openLanguagePicker = () => {
    openPicker(
      LANGUAGE_PICKER_SHEET_ID,
      tCommon("language.title"),
      languageOptions,
      preferredLocale,
      (value) => selectLocale(value as AppLocale | "system"),
      { layout: "center", showCloseButton: false },
      true,
    );
  };

  const openThemeCreator = () => {
    app.themeCreator.setSpaceId(null);
    openSheet(
      "theme-creator",
      <ThemeCreatorSheet
        embedded
        onClose={() => closeSheet("theme-creator")}
      />,
      FULL_SHEET_PROPS,
    );
  };

  if (!settings) return null;

  const defaultThemes = [baseDarkTheme, baseLightTheme];

  const defaultColorThemes = app.themes.all
    .filter((theme) => !theme.author)
    .filter((theme) => theme.id !== "baseDark" && theme.id !== "baseLight");

  const normalThemes = defaultColorThemes.filter(
    (theme) => theme.style === "normal",
  );

  const gradientThemes = defaultColorThemes.filter(
    (theme) => theme.style === "gradient",
  );

  const userThemes = app.themes.all.filter(
    (theme) => theme.author && !theme.spaceId,
  );

  const isThemeSelected = (theme: StoreTheme | typeof baseDarkTheme) =>
    theme.id === currentTheme.id && currentType === theme.type;

  const handleThemeChange = (theme: StoreTheme | typeof baseDarkTheme) => {
    if (theme.id === currentTheme.id && currentType === theme.type) return;

    changeTheme(Theme.toEmotion(theme));
    settings.setCurrentTheme(theme.id);
    app.themes.setCurrentTheme(theme.id);
    app.themes.setCurrentType(theme.type);
  };

  const handleSyncWithSystem = () => {
    if (!currentType) return;

    changeTheme(null);
    settings.setCurrentTheme(null);
    app.themes.setCurrentTheme(null);
    app.themes.setCurrentType(null);
  };

  const currentIconId = app.themes.currentIcon;

  const handleIconChange = (iconId: string | null) => {
    if (iconId === currentIconId) return;

    app.themes.setCurrentIcon(iconId);
    settings.setCurrentIcon(iconId);
    void settings.sync();
  };

  const handleDeleteTheme = async (theme: StoreTheme) => {
    if (deletingThemeId) return;

    setDeletingThemeId(theme.id);

    try {
      await app.rest.delete<{ id: string }>(`@me/themes/${theme.id}`);
      const deletingCurrent = currentTheme.id === theme.id;

      app.themes.remove(theme.id);

      if (deletingCurrent) {
        const fallback = prefersDark ? baseDarkTheme : baseLightTheme;
        changeTheme(Theme.toEmotion(fallback));
        settings.setCurrentTheme(fallback.id);
        app.themes.setCurrentTheme(fallback.id);
        app.themes.setCurrentType(fallback.type);
        void settings.sync();
      }
    } finally {
      setDeletingThemeId(null);
    }
  };

  const systemBaseTheme = prefersDark ? baseDarkTheme : baseLightTheme;
  const systemStops = getThemeSwatchStops(
    systemBaseTheme.colors.background,
    systemBaseTheme.colors.primary,
  );

  return (
    <SettingsScroll>
        <SettingsSection
          title={tCommon("language.title")}
          description={tCommon("language.description")}
        >
          <SettingsSelectRow
            title={tCommon("language.title")}
            value={selectedLocaleLabel}
            onPress={openLanguagePicker}
          />
        </SettingsSection>

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
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              minWidth: 0,
            }}
          >
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                flexShrink: 1,
                minWidth: 0,
              }}
            >
              <Typography level="body-md" weight={700}>
                {t("appearance.themes")}
              </Typography>
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

          <SettingsToggleRow
            title={t("appearance.preferEmbossedShort")}
            checked={settings.preferEmbossed}
            onChange={() => {
              settings.togglePreferEmbossed();
            }}
          />

          <SectionHeader title={t("appearance.defaultThemes")} />
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
                selected={isThemeSelected(theme)}
                onPress={() => handleThemeChange(theme)}
              />
            ))}
            <ThemeSwatch
              stops={systemStops}
              selected={!currentType}
              badgeIcon={currentType ? "sync" : "check"}
              alwaysShowBadge
              onPress={handleSyncWithSystem}
            />
          </Box>

          {userThemes.length > 0 && (
            <>
              <SectionHeader title={t("appearance.yourThemes")} />
              <ThemeGrid
                themes={userThemes}
                isSelected={isThemeSelected}
                onSelect={handleThemeChange}
                onDelete={(theme) => void handleDeleteTheme(theme)}
                deletingId={deletingThemeId}
              />
            </>
          )}

          <SectionHeader title={t("appearance.colorThemes")} />

          <Typography level="body-xs" weight={700}>
            {t("appearance.normal")}
          </Typography>
          <ThemeGrid
            themes={normalThemes}
            isSelected={isThemeSelected}
            onSelect={handleThemeChange}
          />

          <Typography level="body-xs" weight={700}>
            {t("appearance.gradient")}
          </Typography>
          <ThemeGrid
            themes={gradientThemes}
            isSelected={isThemeSelected}
            onSelect={handleThemeChange}
          />
        </Paper>

        <Paper
          style={{
            padding: 16,
            borderRadius: 12,
            gap: 12,
            minWidth: 0,
          }}
          elevation={app.settings?.preferEmbossed ? 2 : 0}
        >
          <Typography level="body-md" weight={700}>
            {t("appearance.icons")}
          </Typography>
          <Typography level="body-xs" textColor="muted">
            {t("appearance.iconsDescriptionMobile")}
          </Typography>

          <SectionHeader title={t("appearance.defaultIcons")} />
          <Box
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              paddingVertical: 8,
            }}
          >
            <IconSwatch
              primaryColor={currentTheme.colors.primary}
              selected={!currentIconId}
              badgeIcon={currentIconId ? "sync" : "check"}
              alwaysShowBadge
              onPress={() => handleIconChange(null)}
            />
            {defaultColorThemes.map((iconTheme) => (
              <IconSwatch
                key={`icon-${iconTheme.id}`}
                primaryColor={iconTheme.colors.primary}
                selected={currentIconId === iconTheme.id}
                onPress={() => handleIconChange(iconTheme.id)}
              />
            ))}
          </Box>

          {userThemes.length > 0 && (
            <>
              <SectionHeader title={t("appearance.yourIcons")} />
              <Box
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                  paddingVertical: 8,
                }}
              >
                {userThemes.map((iconTheme) => (
                  <IconSwatch
                    key={`user-icon-${iconTheme.id}`}
                    primaryColor={iconTheme.colors.primary}
                    selected={currentIconId === iconTheme.id}
                    onPress={() => handleIconChange(iconTheme.id)}
                  />
                ))}
              </Box>
            </>
          )}
        </Paper>

        <SettingsSection
          title={t("appearance.startupMode")}
          description={t("appearance.startupModeDescription")}
        >
          <SettingsSelectRow
            title={t("appearance.startupMode")}
            value={
              settings.preferredMode === "feed"
                ? t("appearance.startupModeFeed")
                : t("appearance.startupModeSpaces")
            }
            onPress={() =>
              openPicker(
                "appearance-startup-mode",
                t("appearance.startupMode"),
                [
                  {
                    value: "spaces",
                    label: t("appearance.startupModeSpaces"),
                  },
                  {
                    value: "feed",
                    label: t("appearance.startupModeFeed"),
                  },
                ],
                settings.preferredMode === "feed" ? "feed" : "spaces",
                (value) => {
                  settings.setPreferredMode(value as "spaces" | "feed");
                  void settings.sync();
                },
              )
            }
          />
        </SettingsSection>

        <SettingsSection title={t("appearance.convertEmoticons")}>
          <SettingsToggleRow
            title={t("appearance.convertEmoticons")}
            description={t("appearance.convertEmoticonsDescription")}
            checked={settings.extendedSettings.convertEmoticons}
            onChange={(checked) => {
              settings.patchExtendedSettings({ convertEmoticons: checked });
              void settings.sync();
            }}
          />
        </SettingsSection>
        <AppAppearanceExtrasSettings />
    </SettingsScroll>
  );
});
