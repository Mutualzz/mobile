import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { useOpenBottomSheet } from "@hooks/useOpenBottomSheet";
import { Box, Switch, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const SHEET_ID = "noise-suppression";

export const NoiseSuppressionSheetContent = observer(() => {
  const { t } = useTranslation("chat");
  const app = useAppStore();
  const voice = app.voice;
  const enabled = voice.noiseSuppression;
  const pending = voice.noiseSuppressionPending;

  return (
    <Paper
      elevation={app.settings?.preferEmbossed ? 4 : 2}
      style={{
        width: "100%",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        gap: 12,
      }}
    >
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Typography level="body-md" weight={700}>
          {t("voice.controls.noiseSuppression")}
        </Typography>
        <Switch
          checked={enabled}
          disabled={pending}
          color="primary"
          onChange={(checked) => {
            void voice.setNoiseSuppression(checked);
          }}
        />
      </Box>
      <Typography level="body-sm" textColor="muted">
        {pending
          ? t("voice.controls.noiseSuppressionApplying")
          : t("voice.controls.noiseSuppressionDescription")}
      </Typography>
    </Paper>
  );
});

export function useNoiseSuppressionSheet() {
  const { openBottomSheet } = useOpenBottomSheet();

  return () => {
    openBottomSheet(SHEET_ID, <NoiseSuppressionSheetContent />);
  };
}
