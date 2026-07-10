import { useAppStore } from "@hooks/useStores";
import { Box, Divider, Input, Switch, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";

export const ThemeCreatorDetailsPage = observer(() => {
  const app = useAppStore();
  const { values, errors, setValues } = app.themeCreator;

  const handleAdaptiveToggle = (checked: boolean) => {
    app.themeCreator.setValues({ adaptive: checked });
  };

  return (
    <Box style={{ gap: 16 }}>
      <Box style={{ gap: 8 }}>
        <Typography level="body-sm" weight={700}>
          Theme name
        </Typography>
        <Input
          value={values.name}
          onChangeText={(name) => setValues({ name })}
          placeholder="My theme"
          maxLength={64}
        />
        {errors.name && (
          <Typography level="body-xs" color="danger" variant="plain">
            {errors.name}
          </Typography>
        )}
      </Box>

      <Box style={{ gap: 8 }}>
        <Typography level="body-sm" weight={700}>
          Description
        </Typography>
        <Input
          value={values.description ?? ""}
          onChangeText={(description) => setValues({ description })}
          placeholder="Optional description"
          maxLength={200}
        />
      </Box>

      <Divider lineColor="muted" />

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: values.adaptive }}
        onPress={() => handleAdaptiveToggle(!values.adaptive)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Box style={{ flex: 1, gap: 2 }}>
          <Typography level="body-sm" weight={700}>
            Adaptive theme
          </Typography>
          <Typography level="body-xs" textColor="muted">
            Auto-derive surface and text colors from a base palette
          </Typography>
        </Box>
        <Switch checked={values.adaptive} onChange={handleAdaptiveToggle} />
      </Pressable>
    </Box>
  );
});
