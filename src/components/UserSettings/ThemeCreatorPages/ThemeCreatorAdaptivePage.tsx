import { useAppStore } from "@hooks/useStores";
import { createColor, type ColorLike } from "@mutualzz/ui-core";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { ThemeCreatorColorField } from "./ThemeCreatorColorField";

export const ThemeCreatorAdaptivePage = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { values, setValues } = app.themeCreator;

  return (
    <Box style={{ gap: 10 }}>
      <ThemeCreatorColorField
        label={t("themeCreator.colors.baseColor")}
        value={values.colors.background}
        onChange={(color: ColorLike) =>
          setValues({
            type: createColor(color).isDark() ? "dark" : "light",
            colors: { ...values.colors, background: color },
          })
        }
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.primaryShort")}
        value={values.colors.primary}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, primary: color } })
        }
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.baseTextShort")}
        value={values.typography.colors.primary}
        onChange={(color: ColorLike) =>
          setValues({
            typography: {
              ...values.typography,
              colors: { ...values.typography.colors, primary: color },
            },
          })
        }
      />
    </Box>
  );
});
