import { GoogleFontPicker } from "@components/FontPicker/GoogleFontPicker";
import { useAppStore } from "@hooks/useStores";
import type { ColorLike } from "@mutualzz/ui-core";
import { extractPrimaryFontFamily } from "@mutualzz/ui-core";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { ThemeCreatorColorField } from "./ThemeCreatorColorField";

export const ThemeCreatorTypographyPage = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { values, setValues } = app.themeCreator;

  return (
    <Box style={{ gap: 10 }}>
      <GoogleFontPicker
        fontOwnerId={app.account?.id}
        value={
          extractPrimaryFontFamily(values.typography.fontFamily) ??
          values.typography.fontFamily
        }
        onChange={(family) =>
          setValues({
            typography: {
              ...values.typography,
              fontFamily: family ?? values.typography.fontFamily,
            },
          })
        }
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.primaryTextShort")}
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
      <ThemeCreatorColorField
        label={t("themeCreator.colors.secondaryTextShort")}
        value={values.typography.colors.secondary}
        onChange={(color: ColorLike) =>
          setValues({
            typography: {
              ...values.typography,
              colors: { ...values.typography.colors, secondary: color },
            },
          })
        }
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.accentTextShort")}
        value={values.typography.colors.accent}
        onChange={(color: ColorLike) =>
          setValues({
            typography: {
              ...values.typography,
              colors: { ...values.typography.colors, accent: color },
            },
          })
        }
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.mutedTextShort")}
        value={values.typography.colors.muted}
        onChange={(color: ColorLike) =>
          setValues({
            typography: {
              ...values.typography,
              colors: { ...values.typography.colors, muted: color },
            },
          })
        }
      />
    </Box>
  );
});
