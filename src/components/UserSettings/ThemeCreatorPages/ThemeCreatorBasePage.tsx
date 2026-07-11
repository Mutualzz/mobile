import { useAppStore } from "@hooks/useStores";
import {
  createColor,
  extractColors,
  isValidGradient,
  type ColorLike,
} from "@mutualzz/ui-core";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { ThemeCreatorColorField } from "./ThemeCreatorColorField";

export const ThemeCreatorBasePage = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { values, setValues } = app.themeCreator;

  const applyBackgroundColor = (color: ColorLike) => {
    let isDark: boolean;
    let isGradient = false;

    if (
      isValidGradient(color) &&
      extractColors(color) &&
      extractColors(color)!.length > 0
    ) {
      isDark = createColor(extractColors(color)![0]).isDark();
      isGradient = true;
    } else {
      isDark = createColor(color).isDark();
    }

    setValues({
      ...values,
      type: isDark ? "dark" : "light",
      style: isGradient ? "gradient" : "normal",
      colors: { ...values.colors, background: color },
    });
  };

  return (
    <Box style={{ gap: 10 }}>
      <ThemeCreatorColorField
        label={t("themeCreator.colors.backgroundShort")}
        value={values.colors.background}
        onChange={applyBackgroundColor}
        allowGradient
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.surfaceShort")}
        value={values.colors.surface}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, surface: color } })
        }
        allowGradient
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.blackShort")}
        value={values.colors.common.black}
        onChange={(color: ColorLike) =>
          setValues({
            colors: {
              ...values.colors,
              common: { ...values.colors.common, black: color },
            },
          })
        }
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.whiteShort")}
        value={values.colors.common.white}
        onChange={(color: ColorLike) =>
          setValues({
            colors: {
              ...values.colors,
              common: { ...values.colors.common, white: color },
            },
          })
        }
      />
    </Box>
  );
});
