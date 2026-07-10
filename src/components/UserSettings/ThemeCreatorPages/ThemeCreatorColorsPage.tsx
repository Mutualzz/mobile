import { useAppStore } from "@hooks/useStores";
import { Box, Divider, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
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
  const app = useAppStore();
  const { values } = app.themeCreator;

  if (values.adaptive) {
    return <ThemeCreatorAdaptivePage />;
  }

  return (
    <Box style={{ gap: 12 }}>
      <SectionHeader title="Base" />
      <ThemeCreatorBasePage />
      <SectionHeader title="Semantic" />
      <ThemeCreatorFeedbackPage />
      <SectionHeader title="Typography" />
      <ThemeCreatorTypographyPage />
    </Box>
  );
});
