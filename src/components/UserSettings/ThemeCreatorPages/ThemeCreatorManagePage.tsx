import { Paper } from "@components/Paper";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import type {
  ThemeCreatorFilter,
  ThemeCreatorLoadedType,
} from "@stores/ThemeCreator.store";
import { Theme } from "@stores/objects/Theme";
import { sortThemes } from "@utils/index";
import { Box, Button, Typography, useTheme } from "@mutualzz/ui-native";
import { CaretDownIcon, CheckIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";

const LOADED_TYPES: ThemeCreatorLoadedType[] = ["default", "draft", "custom"];
const AVAILABLE_FILTERS: ThemeCreatorFilter[] = [
  "light",
  "dark",
  "adaptive",
  "normal",
  "gradient",
];

interface Props {
  onDeleteTheme: () => void;
  deletingTheme: boolean;
}

export const ThemeCreatorManagePage = observer(
  ({ onDeleteTheme, deletingTheme }: Props) => {
    const { t } = useTranslation("settings");
    const app = useAppStore();
    const { theme: uiTheme } = useTheme();
    const { openSheet, closeSheet } = useSheet();
    const themeCreator = app.themeCreator;
    const {
      loadedType,
      setLoadedType,
      values,
      loadValues,
      filters,
      addFilter,
      removeFilter,
      resetFilters,
    } = themeCreator;

    const themes = themeCreator.filter(
      loadedType === "custom"
        ? app.themes.all.filter((t) =>
            themeCreator.spaceId
              ? t.spaceId === themeCreator.spaceId
              : !!t.authorId && !t.spaceId,
          )
        : loadedType === "draft"
          ? app.drafts.themes.map((draft) => new Theme(app, draft))
          : app.themes.all.filter((t) => !t.author && !t.spaceId),
    );
    const sortedThemes = sortThemes(themes);

    const selectedTheme = sortedThemes.find((t) => t.id === values.id);

    const toggleFilter = (filter: ThemeCreatorFilter) => {
      if (filters.includes(filter)) removeFilter(filter);
      else addFilter(filter);
    };

    const existingDraft = app.drafts.existsThemeDraft(values);
    const isCustomOwned =
      loadedType === "custom" && !!values.id && values.id.trim() !== "";

    return (
      <Box style={{ gap: 16 }}>
        <Box style={{ gap: 8 }}>
          <Typography level="body-sm" weight={700}>
            {t("themeCreator.manage.source")}
          </Typography>
          <Box style={{ flexDirection: "row", gap: 6 }}>
            {LOADED_TYPES.map((type) => {
              const active = loadedType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setLoadedType(type)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: active
                      ? `${uiTheme.colors.primary}18`
                      : "transparent",
                    borderWidth: 1,
                    borderColor: active
                      ? uiTheme.colors.primary
                      : `${uiTheme.typography.colors.muted}48`,
                  }}
                >
                  <Typography
                    level="body-xs"
                    weight={active ? "bold" : undefined}
                    style={{
                      color: active
                        ? uiTheme.colors.primary
                        : uiTheme.typography.colors.muted,
                    }}
                  >
                    {t(`themeCreator.loadedTypes.${type}`)}
                  </Typography>
                </Pressable>
              );
            })}
          </Box>

          <Pressable
            onPress={() => {
              openSheet(
                "theme-creator-picker",
                <Paper
                  elevation={app.settings?.preferEmbossed ? 4 : 2}
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    maxHeight: "70%",
                    borderRadius: 16,
                    padding: 8,
                    gap: 2,
                  }}
                >
                  <ScrollView>
                    {sortedThemes.map((theme) => {
                      const active = theme.id === values.id;
                      return (
                        <Pressable
                          key={theme.id}
                          onPress={() => {
                            loadValues(Theme.serialize(theme));
                            closeSheet("theme-creator-picker");
                          }}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            backgroundColor: active
                              ? `${uiTheme.colors.primary}18`
                              : undefined,
                          }}
                        >
                          <Typography
                            level="body-sm"
                            weight={active ? 600 : undefined}
                            truncate="single"
                            style={{ flex: 1 }}
                          >
                            {theme.name}
                          </Typography>
                          {active && (
                            <CheckIcon
                              size={16}
                              weight="bold"
                              color={uiTheme.colors.success}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Paper>,
                { layout: "center", showCloseButton: false },
              );
            }}
            disabled={sortedThemes.length === 0}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: `${uiTheme.typography.colors.muted}48`,
              opacity: sortedThemes.length === 0 ? 0.5 : 1,
            }}
          >
            <Typography level="body-sm" truncate="single" style={{ flex: 1 }}>
              {sortedThemes.length === 0
                ? t("themeCreator.manage.noThemesAvailable")
                : (selectedTheme?.name ?? t("themeCreator.manage.pickTheme"))}
            </Typography>
            <CaretDownIcon
              size={14}
              weight="bold"
              color={uiTheme.typography.colors.muted}
            />
          </Pressable>

          {loadedType === "draft" && existingDraft && (
            <Button
              color="danger"
              variant="soft"
              onPress={() => app.drafts.deleteThemeDraft(values)}
            >
              {t("themeCreator.actions.deleteDraft")}
            </Button>
          )}
          {isCustomOwned && (
            <Button
              color="danger"
              variant="soft"
              disabled={deletingTheme}
              onPress={onDeleteTheme}
            >
              {deletingTheme
                ? t("account.deleting")
                : t("themeCreator.actions.deleteTheme")}
            </Button>
          )}
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-sm" weight={700}>
            {t("themeCreator.manage.filters")}
          </Typography>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingRight: 4 }}
          >
            <FilterChip
              label={t("themeCreator.manage.all")}
              active={filters.length === 0}
              onPress={() => resetFilters()}
            />
            {AVAILABLE_FILTERS.map((filter) => (
              <FilterChip
                key={filter}
                label={t(`themeCreator.filters.${filter}`)}
                active={filters.includes(filter)}
                onPress={() => toggleFilter(filter)}
              />
            ))}
          </ScrollView>
        </Box>
      </Box>
    );
  },
);

const FilterChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: active
          ? theme.colors.primary
          : `${theme.typography.colors.muted}48`,
        backgroundColor: active ? `${theme.colors.primary}18` : "transparent",
      }}
    >
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
