import { useAppStore } from "@hooks/useStores";
import { Box, Input, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

export const ThemeCreatorDetailsPage = observer(() => {
  const app = useAppStore();
  const { values, errors, setValues } = app.themeCreator;

  return (
    <Box style={{ gap: 16 }}>
      <Box style={{ gap: 8 }}>
        <Typography level="body-xs" weight={700}>
          Theme name
        </Typography>
        <Input
          value={values.name}
          onChangeText={(name) => setValues({ name })}
          placeholder="My theme"
          maxLength={64}
        />
        {errors.name && (
          <Typography level="body-xs" style={{ color: "#e74c3c" }}>
            {errors.name}
          </Typography>
        )}
      </Box>

      <Box style={{ gap: 8 }}>
        <Typography level="body-xs" weight={700}>
          Description
        </Typography>
        <Input
          value={values.description ?? ""}
          onChangeText={(description) => setValues({ description })}
          placeholder="Optional description"
          maxLength={200}
        />
      </Box>
    </Box>
  );
});
