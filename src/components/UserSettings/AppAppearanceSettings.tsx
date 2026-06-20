import { AdaptiveIconSwatch } from "@components/UserSettings/AdaptiveIconSwatch";
import { ThemeCreatorModal } from "@components/UserSettings/ThemeCreatorModal";
import { Paper } from "@components/Paper";
import { IconButton } from "@components/IconButton";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import {
  CheckIcon,
  PaletteIcon,
  RepeatIcon,
  TrashIcon,
} from "phosphor-react-native";
import { baseDarkTheme, baseLightTheme } from "@mutualzz/ui-core";
import {
  Box,
  Divider,
  Switch,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import type { Theme as StoreTheme } from "@stores/objects/Theme";
import { Theme } from "@stores/objects/Theme";
import { getThemeSwatchStops, type ThemeSwatchStop } from "@utils/themeSwatch";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useColorScheme, Pressable, ScrollView, View } from "react-native";

const SWATCH_SIZE = 64;

const SelectionBadge = ({
  badgeIcon = "check",
}: {
  badgeIcon?: "check" | "sync";
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        position: "absolute",
        top: -1,
        right: -2,
        width: 24,
        height: 24,
        borderRadius: 12,
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

const ThemeSwatchFill = ({ stops }: { stops: ThemeSwatchStop[] }) => (
  <View
    style={{
      flex: 1,
      flexDirection: "row",
      width: "100%",
      height: "100%",
    }}
  >
    {stops.map((stop, index) => (
      <View
        key={`${stop.color}-${index}`}
        style={{
          flex: stop.widthPercent,
          backgroundColor: stop.color,
        }}
      />
    ))}
  </View>
);

const ThemeSwatch = ({
  stops,
  selected,
  onPress,
  badgeIcon = "check",
  alwaysShowBadge = false,
  onDelete,
  deleting = false,
}: {
  stops: ThemeSwatchStop[];
  selected: boolean;
  onPress: () => void;
  badgeIcon?: "check" | "sync";
  alwaysShowBadge?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
}) => {
  const { theme } = useTheme();
  const showBadge = alwaysShowBadge || selected;
  const outline = 3;

  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 4 }}>
      <View
        style={{
          position: "relative",
          width: SWATCH_SIZE,
          height: SWATCH_SIZE,
        }}
      >
        {selected && (
          <View
            style={{
              position: "absolute",
              top: -outline,
              left: -outline,
              width: SWATCH_SIZE + outline * 2,
              height: SWATCH_SIZE + outline * 2,
              borderRadius: (SWATCH_SIZE + outline * 2) / 2,
              borderWidth: outline,
              borderColor: theme.colors.primary,
            }}
          />
        )}
        {onDelete && selected && (
          <IconButton
            padding={4}
            size={12}
            color="danger"
            disabled={deleting}
            onPress={onDelete}
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              zIndex: 2,
            }}
          >
            <TrashIcon size={12} weight="fill" />
          </IconButton>
        )}
        <View
          style={{
            width: SWATCH_SIZE,
            height: SWATCH_SIZE,
            borderRadius: SWATCH_SIZE / 2,
            overflow: "hidden",
            borderWidth: outline,
            borderColor: theme.colors.primary,
          }}
        >
          <ThemeSwatchFill stops={stops} />
        </View>
        {showBadge && <SelectionBadge badgeIcon={badgeIcon} />}
      </View>
    </Pressable>
  );
};

const ThemeGrid = ({
  themes,
  isSelected,
  onSelect,
  onDelete,
  deletingId,
}: {
  themes: StoreTheme[];
  isSelected: (theme: StoreTheme) => boolean;
  onSelect: (theme: StoreTheme) => void;
  onDelete?: (theme: StoreTheme) => void;
  deletingId?: string | null;
}) => (
  <Box
    style={{
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      paddingVertical: 8,
    }}
  >
    {themes.map((theme) => (
      <ThemeSwatch
        key={theme.id}
        stops={getThemeSwatchStops(
          theme.colors.background,
          theme.colors.primary,
        )}
        selected={isSelected(theme)}
        onPress={() => onSelect(theme)}
        onDelete={onDelete ? () => onDelete(theme) : undefined}
        deleting={deletingId === theme.id}
      />
    ))}
  </Box>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Divider lineColor="muted" style={{ marginTop: 8, marginBottom: 4 }}>
    <Typography level="body-sm" weight={700}>
      {title}
    </Typography>
  </Divider>
);

export const AppAppearanceSettings = observer(() => {
  const app = useAppStore();
  const settings = app.settings;
  const { openModal } = useModal();
  const { theme: currentTheme, changeTheme, type: currentType } = useTheme();
  const prefersDark = useColorScheme() === "dark";
  const [deletingThemeId, setDeletingThemeId] = useState<string | null>(null);

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

  const userThemes = app.themes.all.filter((theme) => theme.author);

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
    void settings.sync();
  };

  const handleIconChange = (iconId: string | null) => {
    if (iconId === app.themes.currentIcon) return;

    app.themes.setCurrentIcon(iconId);
    settings.setCurrentIcon(iconId);
    void settings.sync();
  };

  const defaultIconThemes = app.themes.all.filter((theme) => !theme.author);
  const userIconThemes = app.themes.all.filter((theme) => theme.author);
  const currentIconId = app.themes.currentIcon;

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
              Themes
            </Typography>
            <IconButton
              padding={6}
              size={16}
              variant="soft"
              color="neutral"
              onPress={() =>
                openModal("theme-creator", <ThemeCreatorModal />, {
                  style: { padding: 16 },
                })
              }
            >
              <PaletteIcon weight="fill" />
            </IconButton>
          </Box>
        </Box>

        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            minWidth: 0,
          }}
        >
          <Typography level="body-xs" textColor="muted" style={{ flex: 1 }}>
            Prefer embossed
          </Typography>
          <Switch
            checked={settings.preferEmbossed}
            onChange={(value) => {
              settings.setPreferEmbossed(value);
              void settings.sync();
            }}
          />
        </Box>

        <SectionHeader title="Default Themes" />
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
            <SectionHeader title="Your Themes" />
            <ThemeGrid
              themes={userThemes}
              isSelected={isThemeSelected}
              onSelect={handleThemeChange}
              onDelete={(theme) => void handleDeleteTheme(theme)}
              deletingId={deletingThemeId}
            />
          </>
        )}

        <SectionHeader title="Color Themes" />

        <Typography level="body-xs" weight={700}>
          Normal
        </Typography>
        <ThemeGrid
          themes={normalThemes}
          isSelected={isThemeSelected}
          onSelect={handleThemeChange}
        />

        <Typography level="body-xs" weight={700}>
          Gradient
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
          Icons
        </Typography>

        <SectionHeader title="Default Icons" />
        <Box
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            paddingVertical: 8,
          }}
        >
          <Pressable onPress={() => handleIconChange(null)}>
            <View style={{ position: "relative" }}>
              <AdaptiveIconSwatch primaryColor={currentTheme.colors.primary} />
              <SelectionBadge badgeIcon={currentIconId ? "sync" : "check"} />
            </View>
          </Pressable>
          {defaultIconThemes.map((theme) => (
            <Pressable
              key={`icon-${theme.id}`}
              onPress={() => handleIconChange(theme.id)}
            >
              <View style={{ position: "relative" }}>
                <AdaptiveIconSwatch primaryColor={theme.colors.primary} />
                {currentIconId === theme.id && <SelectionBadge />}
              </View>
            </Pressable>
          ))}
        </Box>

        {userIconThemes.length > 0 && (
          <>
            <SectionHeader title="Your Icons" />
            <Box
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 10,
                paddingVertical: 8,
              }}
            >
              {userIconThemes.map((theme) => (
                <Pressable
                  key={`user-icon-${theme.id}`}
                  onPress={() => handleIconChange(theme.id)}
                >
                  <View style={{ position: "relative" }}>
                    <AdaptiveIconSwatch primaryColor={theme.colors.primary} />
                    {currentIconId === theme.id && <SelectionBadge />}
                  </View>
                </Pressable>
              ))}
            </Box>
          </>
        )}
      </Paper>
    </ScrollView>
  );
});
