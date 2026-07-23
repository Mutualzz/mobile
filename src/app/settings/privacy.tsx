import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { AppPrivacySettings } from "@components/UserSettings/AppPrivacySettings";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const PrivacySettings = () => {
  const { t } = useTranslation("settings");
  return (
    <SettingsScreen title={t("pages.privacy")} contentStyle={{ flex: 1 }}>
      <AppPrivacySettings />
    </SettingsScreen>
  );
};

export default observer(PrivacySettings);
