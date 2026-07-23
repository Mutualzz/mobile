import { AppMessagesSettings } from "@components/UserSettings/AppMessagesSettings";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

export default observer(function MessagesSettings() {
  const { t } = useTranslation("settings");

  return (
    <SettingsScreen title={t("pages.messages")} contentStyle={{ flex: 1 }}>
      <AppMessagesSettings />
    </SettingsScreen>
  );
});
