import { useAppStore } from "@hooks/useStores";
import type { ColorLike } from "@mutualzz/ui-core";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { ThemeCreatorColorField } from "./ThemeCreatorColorField";

export const ThemeCreatorFeedbackPage = observer(() => {
  const app = useAppStore();
  const { values, setValues } = app.themeCreator;

  return (
    <Box style={{ gap: 10 }}>
      <ThemeCreatorColorField
        label="Primary"
        value={values.colors.primary}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, primary: color } })
        }
      />
      <ThemeCreatorColorField
        label="Neutral"
        value={values.colors.neutral}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, neutral: color } })
        }
      />
      <ThemeCreatorColorField
        label="Success"
        value={values.colors.success}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, success: color } })
        }
      />
      <ThemeCreatorColorField
        label="Danger"
        value={values.colors.danger}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, danger: color } })
        }
      />
      <ThemeCreatorColorField
        label="Warning"
        value={values.colors.warning}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, warning: color } })
        }
      />
      <ThemeCreatorColorField
        label="Info"
        value={values.colors.info}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, info: color } })
        }
      />
    </Box>
  );
});
