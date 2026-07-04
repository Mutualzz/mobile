import { useAppStore } from "@hooks/useStores";
import { createColor, type ColorLike } from "@mutualzz/ui-core";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { ThemeCreatorColorField } from "./ThemeCreatorColorField";

export const ThemeCreatorBasePage = observer(() => {
  const app = useAppStore();
  const { values, setValues } = app.themeCreator;

  return (
    <Box style={{ gap: 16 }}>
      <ThemeCreatorColorField
        label="Background color"
        description="The background color of the app"
        value={values.colors.background}
        onChange={(color: ColorLike) =>
          setValues({
            type: createColor(color).isDark() ? "dark" : "light",
            colors: { ...values.colors, background: color },
          })
        }
      />
      <ThemeCreatorColorField
        label="Surface color"
        description="Applied to cards, sheets, and menus — auto-adapts to some UI elements. If you prefer an embossed style, adjust this color."
        value={values.colors.surface}
        onChange={(color: ColorLike) =>
          setValues({ colors: { ...values.colors, surface: color } })
        }
      />
      <ThemeCreatorColorField
        label="Black color"
        description="Used for text and icons on a light background"
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
        label="White color"
        description="Used for text and icons on a dark background"
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
