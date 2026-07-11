import { useAppStore } from "@hooks/useStores";
import { Box, Divider, Input, Switch, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

export const ThemeCreatorDetailsPage = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { values, errors, setValues } = app.themeCreator;

  const handleAdaptiveToggle = (checked: boolean) => {
    app.themeCreator.setValues({ adaptive: checked });
  };

  return (
    <Box style={{ gap: 16 }}>
      <Box style={{ gap: 8 }}>
        <Typography level="body-sm" weight={700}>
          {t("themeCreator.details.themeNameShort")}
        </Typography>
        <Input
          value={values.name}
          onChangeText={(name) => setValues({ name })}
          placeholder={t("themeCreator.details.namePlaceholder")}
          maxLength={64}
        />
        {errors.name && (
          <Typography level="body-xs" color="danger" variant="plain">
            {errors.name}
          </Typography>
        )}
      </Box>

      <Box style={{ gap: 8 }}>
        <Typography level="body-sm" weight={700}>
          {t("themeCreator.details.description")}
        </Typography>
        <Input
          value={values.description ?? ""}
          onChangeText={(description) => setValues({ description })}
          placeholder={t("themeCreator.details.descriptionPlaceholder")}
          maxLength={200}
        />
      </Box>

      <Divider lineColor="muted" />

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: values.adaptive }}
        onPress={() => handleAdaptiveToggle(!values.adaptive)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Box style={{ flex: 1, gap: 2 }}>
          <Typography level="body-sm" weight={700}>
            {t("themeCreator.details.adaptiveTheme")}
          </Typography>
          <Typography level="body-xs" textColor="muted">
            {t("themeCreator.details.adaptiveThemeDescription")}
          </Typography>
        </Box>
        <Switch checked={values.adaptive} onChange={handleAdaptiveToggle} />
      </Pressable>
    </Box>
  );
});
