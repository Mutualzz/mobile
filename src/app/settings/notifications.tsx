import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { AppNotificationsSettings } from "@components/UserSettings/AppNotificationsSettings";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const NotificationsSettings = () => {
  const { t } = useTranslation("settings");
  return (
    <SettingsScreen title={t("pages.notifications")}>
      <AppNotificationsSettings />
    </SettingsScreen>
  );
};

export default observer(NotificationsSettings);
