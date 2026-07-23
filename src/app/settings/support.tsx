import {
  SettingsActionRow,
  SettingsScroll,
  SettingsSection,
} from "@components/UserSettings/SettingsField";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

const HELP_CENTER_URL = "https://mutualzz.com/support";

export default observer(function SupportSettings() {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");

  return (
    <SettingsScreen title={t("helpAndSupport")} contentStyle={{ flex: 1 }}>
      <SettingsScroll>
        <SettingsSection>
          <SettingsActionRow
            title={t("helpAndSupport")}
            description={tCommon("support.mobileIntro")}
            actionLabel={tCommon("support.openHelpCenter")}
            onPress={() => void Linking.openURL(HELP_CENTER_URL)}
          />
        </SettingsSection>
      </SettingsScroll>
    </SettingsScreen>
  );
});
