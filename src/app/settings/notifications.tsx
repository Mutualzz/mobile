import { AppNotificationsSettings } from "@components/UserSettings/AppNotificationsSettings";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { observer } from "mobx-react-lite";

const NotificationsSettings = () => {
  return (
    <SettingsScreen title="Notifications">
      <AppNotificationsSettings />
    </SettingsScreen>
  );
};

export default observer(NotificationsSettings);
