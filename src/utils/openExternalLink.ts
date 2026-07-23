import type { AppStore } from "@stores/App.store";
import { Alert, Linking } from "react-native";
import i18n from "../i18n";

export async function openExternalLink(app: AppStore, url: string) {
  const normalized = url.trim();
  if (!normalized) return;

  if (app.dontShowLinkWarning) {
    await Linking.openURL(normalized);
    return;
  }

  await new Promise<void>((resolve) => {
    Alert.alert(
      i18n.t("externalLink.title", { ns: "common" }),
      `${i18n.t("externalLink.aboutToOpen", { ns: "common" })}\n\n${normalized}`,
      [
        {
          text: i18n.t("externalLink.close", { ns: "common" }),
          style: "cancel",
          onPress: () => resolve(),
        },
        {
          text: i18n.t("externalLink.proceed", { ns: "common" }),
          onPress: () => {
            void Linking.openURL(normalized).finally(resolve);
          },
        },
        {
          text: i18n.t("externalLink.dontShowAgain", { ns: "common" }),
          onPress: () => {
            app.setDontShowLinkWarning(true);
            void Linking.openURL(normalized).finally(resolve);
          },
        },
      ],
    );
  });
}
