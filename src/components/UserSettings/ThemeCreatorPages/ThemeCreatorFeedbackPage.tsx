import { useAppStore } from "@hooks/useStores";
import type { ColorLike } from "@mutualzz/ui-core";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { ThemeCreatorColorField } from "./ThemeCreatorColorField";

export const ThemeCreatorFeedbackPage = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { values, setValues } = app.themeCreator;

  return (
    <Box style={{ gap: 10 }}>
      <ThemeCreatorColorField
        label={t("themeCreator.colors.primaryShort")}
        value={values.colors.primary}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, primary: color } })
        }
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.neutralShort")}
        value={values.colors.neutral}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, neutral: color } })
        }
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.successShort")}
        value={values.colors.success}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, success: color } })
        }
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.dangerShort")}
        value={values.colors.danger}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, danger: color } })
        }
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.warningShort")}
        value={values.colors.warning}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, warning: color } })
        }
      />
      <ThemeCreatorColorField
        label={t("themeCreator.colors.infoShort")}
        value={values.colors.info}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, info: color } })
        }
      />
    </Box>
  );
});
