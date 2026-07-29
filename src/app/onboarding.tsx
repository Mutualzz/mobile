import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const OnboardingRoute = () => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const router = useRouter();

  const finish = (path: "/(tabs)/feed" | "/settings/profile" | "/(tabs)/spaces") => {
    app.completeOnboarding();
    router.replace(path);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 24 }}>
      <Box style={{ gap: 8, alignItems: "center" }}>
        <Typography level="h4" style={{ textAlign: "center" }}>
          {t("onboarding.welcomeTitle")}
        </Typography>
        <Typography textColor="muted" style={{ textAlign: "center" }}>
          {t("onboarding.welcomeDescription")}
        </Typography>
      </Box>
      <Box style={{ gap: 12 }}>
        <Button onPress={() => finish("/settings/profile")}>
          {t("onboarding.setupProfile")}
        </Button>
        <Button variant="soft" onPress={() => finish("/(tabs)/feed")}>
          {t("onboarding.exploreFeed")}
        </Button>
        <Button variant="plain" onPress={() => finish("/(tabs)/spaces")}>
          {t("onboarding.skipToSpaces")}
        </Button>
      </Box>
    </View>
  );
};

export default observer(OnboardingRoute);
