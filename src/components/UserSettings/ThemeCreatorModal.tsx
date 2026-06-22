import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import type { APITheme, HttpException } from "@mutualzz/types";
import { createColor, formatColor, type ColorLike } from "@mutualzz/ui-core";
import {
  Box,
  Button,
  Input,
  Switch,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import { Theme } from "@stores/objects/Theme";
import { applyAdaptiveThemeValues } from "@utils/adaptation";
import Snowflake from "@utils/Snowflake";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";

const parseColorInput = (value: string, fallback: ColorLike) => {
  try {
    return formatColor(
      createColor(value ? (value.trim() as ColorLike) : fallback),
    );
  } catch {
    return formatColor(fallback);
  }
};

export const ThemeCreatorModal = observer(() => {
  const app = useAppStore();
  const { closeModal } = useModal();
  const { theme: activeTheme, changeTheme } = useTheme();
  const themeCreator = app.themeCreator;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    themeCreator.resetValues();
    return () => {
      themeCreator.stopPreview(changeTheme);
    };
  }, [changeTheme, themeCreator]);

  const { values } = themeCreator;

  const updateBackground = (raw: string) => {
    const background = parseColorInput(raw, values.colors.background);
    const isDark = createColor(background).isDark();

    themeCreator.setValues({
      colors: {
        ...values.colors,
        background,
      },
      type: isDark ? "dark" : "light",
    });
  };

  const updatePrimary = (raw: string) => {
    themeCreator.setValues({
      colors: {
        ...values.colors,
        primary: parseColorInput(raw, values.colors.primary),
      },
    });
  };

  const handlePreview = (enabled: boolean) => {
    if (enabled) {
      themeCreator.startPreview(changeTheme, Theme.serialize(activeTheme));
      return;
    }

    themeCreator.stopPreview(changeTheme);
  };

  const handleSave = async () => {
    if (saving || themeCreator.nameEmpty) return;

    setSaving(true);
    setError(null);

    try {
      let payload = {
        ...values,
        id: Snowflake.generate(),
      };

      if (values.adaptive) {
        payload = {
          ...applyAdaptiveThemeValues(values),
          id: Snowflake.generate(),
        };
      }

      const created = await app.rest.post<APITheme, APITheme>(
        "@me/themes",
        payload,
      );

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
      closeModal("theme-creator");
    } catch (e) {
      const httpError = e as HttpException;
      if (httpError?.errors?.length) {
        const next: Record<string, string> = {};
        httpError.errors.forEach((entry) => {
          next[entry.path] = entry.message;
        });
        themeCreator.setErrors(next);
        setError(httpError.message ?? "Failed to save theme");
      } else {
        setError(getErrorMessage(e, "Failed to save theme"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      style={{
        width: "100%",
        maxWidth: 420,
        maxHeight: "85%",
        borderRadius: 16,
        overflow: "hidden",
      }}
      elevation={app.settings?.preferEmbossed ? 4 : 2}
    >
      <Typography level="body-md" weight={700} style={{ flex: 1, minWidth: 0 }}>
        Theme Creator
      </Typography>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Box style={{ gap: 8 }}>
          <Typography level="body-xs" textColor="muted">
            Theme name
          </Typography>
          <Input
            value={values.name}
            onChangeText={(name) => themeCreator.setValues({ name })}
            placeholder="My theme"
            maxLength={64}
          />
          {themeCreator.errors.name && (
            <Typography level="body-xs" style={{ color: "#e74c3c" }}>
              {themeCreator.errors.name}
            </Typography>
          )}
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-xs" textColor="muted">
            Description
          </Typography>
          <Input
            value={values.description ?? ""}
            onChangeText={(description) =>
              themeCreator.setValues({ description })
            }
            placeholder="Optional description"
            maxLength={200}
          />
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-xs" textColor="muted">
            Background color
          </Typography>
          <Input
            value={String(values.colors.background)}
            onChangeText={updateBackground}
            placeholder="#111111"
            autoCapitalize="none"
          />
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-xs" textColor="muted">
            Primary color
          </Typography>
          <Input
            value={String(values.colors.primary)}
            onChangeText={updatePrimary}
            placeholder="#5865f2"
            autoCapitalize="none"
          />
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-xs" textColor="muted">
            Success color
          </Typography>
          <Input
            value={String(values.colors.success ?? "")}
            onChangeText={(raw) =>
              themeCreator.setValues({
                colors: {
                  ...values.colors,
                  success: parseColorInput(
                    raw,
                    values.colors.success ?? "#2ecc71",
                  ),
                },
              })
            }
            placeholder="#2ecc71"
            autoCapitalize="none"
          />
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-xs" textColor="muted">
            Warning color
          </Typography>
          <Input
            value={String(values.colors.warning ?? "")}
            onChangeText={(raw) =>
              themeCreator.setValues({
                colors: {
                  ...values.colors,
                  warning: parseColorInput(
                    raw,
                    values.colors.warning ?? "#f1c40f",
                  ),
                },
              })
            }
            placeholder="#f1c40f"
            autoCapitalize="none"
          />
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-xs" textColor="muted">
            Danger color
          </Typography>
          <Input
            value={String(values.colors.danger ?? "")}
            onChangeText={(raw) =>
              themeCreator.setValues({
                colors: {
                  ...values.colors,
                  danger: parseColorInput(
                    raw,
                    values.colors.danger ?? "#e74c3c",
                  ),
                },
              })
            }
            placeholder="#e74c3c"
            autoCapitalize="none"
          />
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
          <Switch
            checked={values.adaptive}
            onChange={(checked) =>
              themeCreator.setValues({ adaptive: checked })
            }
          />
        </Box>

        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Typography level="body-sm" weight={700}>
            Preview
          </Typography>
          <Switch checked={themeCreator.inPreview} onChange={handlePreview} />
        </Box>

        {error && (
          <Typography level="body-sm" style={{ color: "#e74c3c" }}>
            {error}
          </Typography>
        )}

        <Button
          color="primary"
          disabled={themeCreator.nameEmpty || saving}
          onPress={() => handleSave()}
        >
          {saving ? "Saving..." : "Create Theme"}
        </Button>
      </ScrollView>
    </Paper>
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
