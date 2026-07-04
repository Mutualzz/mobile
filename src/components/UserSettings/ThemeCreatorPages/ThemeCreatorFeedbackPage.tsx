import { useAppStore } from "@hooks/useStores";
import type { ColorLike } from "@mutualzz/ui-core";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { ThemeCreatorColorField } from "./ThemeCreatorColorField";

export const ThemeCreatorFeedbackPage = observer(() => {
  const app = useAppStore();
  const { values, setValues } = app.themeCreator;

  return (
    <Box style={{ gap: 16 }}>
      <ThemeCreatorColorField
        label="Primary color"
        description="Used to indicate the primary action or important elements. Auto-generated icons derive from this color."
        value={values.colors.primary}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, primary: color } })
        }
      />
      <ThemeCreatorColorField
        label="Neutral color"
        description="Used to indicate a neutral or inactive state"
        value={values.colors.neutral}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, neutral: color } })
        }
      />
      <ThemeCreatorColorField
        label="Success color"
        description="Used to indicate a successful or positive action"
        value={values.colors.success}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, success: color } })
        }
      />
      <ThemeCreatorColorField
        label="Danger color"
        description="Used to indicate errors and failure within the app"
        value={values.colors.danger}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, danger: color } })
        }
      />
      <ThemeCreatorColorField
        label="Warning color"
        description="Used to indicate caution and requires user attention"
        value={values.colors.warning}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, warning: color } })
        }
      />
      <ThemeCreatorColorField
        label="Info color"
        description="Used to indicate additional information"
        value={values.colors.info}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, info: color } })
        }
      />
    </Box>
  );
});
