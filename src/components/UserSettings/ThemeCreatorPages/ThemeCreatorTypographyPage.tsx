import { GoogleFontPicker } from "@components/FontPicker/GoogleFontPicker";
import { useAppStore } from "@hooks/useStores";
import type { ColorLike } from "@mutualzz/ui-core";
import { extractPrimaryFontFamily } from "@mutualzz/ui-core";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { ThemeCreatorColorField } from "./ThemeCreatorColorField";

export const ThemeCreatorTypographyPage = observer(() => {
  const app = useAppStore();
  const { values, setValues } = app.themeCreator;

  return (
    <Box style={{ gap: 16 }}>
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
        label="Primary text color"
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
      <ThemeCreatorColorField
        label="Secondary text color"
        description="Used for less important text"
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
        label="Accent text color"
        description="Used for accentuating important text"
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
        label="Muted text color"
        description="Used for muted text"
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
