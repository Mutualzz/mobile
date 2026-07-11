import { useAppStore } from "@hooks/useStores";
import { Box, Divider, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { ThemeCreatorAdaptivePage } from "./ThemeCreatorAdaptivePage";
import { ThemeCreatorBasePage } from "./ThemeCreatorBasePage";
import { ThemeCreatorFeedbackPage } from "./ThemeCreatorFeedbackPage";
import { ThemeCreatorTypographyPage } from "./ThemeCreatorTypographyPage";

const SectionHeader = ({ title }: { title: string }) => (
  <Divider lineColor="muted" style={{ marginTop: 4 }}>
    <Typography level="body-sm" weight={700}>
      {title}
    </Typography>
  </Divider>
);

export const ThemeCreatorColorsPage = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { values } = app.themeCreator;

  if (values.adaptive) {
    return <ThemeCreatorAdaptivePage />;
  }

  return (
    <Box style={{ gap: 12 }}>
      <SectionHeader title={t("themeCreator.sections.base")} />
      <ThemeCreatorBasePage />
      <SectionHeader title={t("themeCreator.sections.semantic")} />
      <ThemeCreatorFeedbackPage />
      <SectionHeader title={t("themeCreator.sections.typography")} />
      <ThemeCreatorTypographyPage />
    </Box>
  );
});
