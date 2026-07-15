import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import { Box } from "@mutualzz/ui-native";
import { peekPendingNavigation } from "@utils/pendingNavigation";
import { splashBackgroundForScheme } from "@utils/splash";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Linking, useColorScheme, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const IndexRoute = () => {
  const { t } = useTranslation("auth");
  const app = useAppStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scheme = useColorScheme();

  useEffect(() => {
    if (!app.isReady || !app.settings || !app.token) return;
    if (peekPendingNavigation()) return;

    router.replace(app.settings.preferredMode === "feed" ? "/feed" : "/spaces");
  }, [app.isReady, app.settings, app.token, router]);

  if (app.token) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: splashBackgroundForScheme(scheme),
        }}
      />
    );
  }

  return (
    <Box
      style={{
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        flexDirection: "column",
        backgroundColor: splashBackgroundForScheme(scheme),
        marginBottom: insets.bottom + 10,
        paddingHorizontal: 16,
        gap: 12,
      }}
    >
      <Box style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
        <Button
          expand
          onPress={() =>
            Linking.openURL("https://mutualzz.com/privacy").catch(() => {
              // ignore
            })
          }
        >
          {t("landing.privacyPolicy")}
        </Button>
        <Button
          expand
          onPress={() =>
            Linking.openURL("https://mutualzz.com/tos").catch(() => {
              // ignore
            })
          }
        >
          {t("landing.termsOfService")}
        </Button>
      </Box>
      <Box style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
        <Button expand onPress={() => router.replace("/login")}>
          {t("landing.login")}
        </Button>

        <Button expand onPress={() => router.replace("/register")}>
          {t("landing.register")}
        </Button>
      </Box>
    </Box>
  );
};

export default observer(IndexRoute);
