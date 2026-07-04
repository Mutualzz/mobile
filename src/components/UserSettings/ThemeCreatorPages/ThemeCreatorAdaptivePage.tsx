import { useAppStore } from "@hooks/useStores";
import { createColor, type ColorLike } from "@mutualzz/ui-core";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { ThemeCreatorColorField } from "./ThemeCreatorColorField";

export const ThemeCreatorAdaptivePage = observer(() => {
  const app = useAppStore();
  const { values, setValues } = app.themeCreator;

  return (
    <Box style={{ gap: 16 }}>
      <ThemeCreatorColorField
        label="Base color"
        description="The base color of the app — surface, neutral, and semantic colors are derived from this"
        value={values.colors.background}
        onChange={(color: ColorLike) =>
          setValues({
            type: createColor(color).isDark() ? "dark" : "light",
            colors: { ...values.colors, background: color },
          })
        }
      />
      <ThemeCreatorColorField
        label="Primary color"
        description="Used to indicate the primary action or important elements. Auto-generated icons derive from this color."
        value={values.colors.primary}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, primary: color } })
        }
      />
      <ThemeCreatorColorField
        label="Base text color"
        description="The base color for text. Usually white-ish on dark backgrounds, black-ish on light backgrounds."
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
