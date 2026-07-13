import { Button } from "@components/Button";
import { BrandLoader } from "@components/BrandLoader";
import { useAppStore } from "@hooks/useStores";
import { Box, ButtonGroup } from "@mutualzz/ui-native";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const IndexRoute = () => {
  const { t } = useTranslation("auth");
  const app = useAppStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    if (!app.isReady || !app.settings || !app.token) return;

    router.replace(app.settings.preferredMode === "feed" ? "/feed" : "/spaces");
  }, [app.isReady, app.settings, app.token]);

  return (
    <Box
      style={{
        flex: 1,
        justifyContent: !app.token ? "flex-end" : "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {app.token && <BrandLoader size={100} />}
      {!app.token && (
        <Box
          style={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: insets.bottom + 10,
          }}
        >
          <ButtonGroup spacing={10} size="lg">
            <Button onPress={() => router.replace("/login")}>
              {t("landing.login")}
            </Button>
            <Button
              onPress={() =>
                Linking.openURL("https://mutualzz.com/privacy").catch(() => {})
              }
            >
              {t("landing.privacyPolicy")}
            </Button>
            <Button
              onPress={() =>
                Linking.openURL("https://mutualzz.com/tos").catch(() => {})
              }
            >
              {t("landing.termsOfService")}
            </Button>
            <Button onPress={() => router.replace("/register")}>
              {t("landing.register")}
            </Button>
          </ButtonGroup>
        </Box>
      )}
    </Box>
  );
};

export default observer(IndexRoute);
