import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { AppAppearanceSettings } from "@components/UserSettings/AppAppearanceSettings";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const AppearanceSettings = () => {
  const { t } = useTranslation("settings");
  return (
    <SettingsScreen title={t("pages.appearance")} contentStyle={{ flex: 1 }}>
      <AppAppearanceSettings />
    </SettingsScreen>
  );
};

export default observer(AppearanceSettings);
