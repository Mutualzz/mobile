import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { AppNotificationsSettings } from "@components/UserSettings/AppNotificationsSettings";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

export default observer(function NotificationsSettings() {
  const { t } = useTranslation("settings");
  return (
    <SettingsScreen title={t("pages.notifications")} contentStyle={{ flex: 1 }}>
      <AppNotificationsSettings />
    </SettingsScreen>
  );
});
