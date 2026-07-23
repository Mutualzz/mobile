import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { UserExpressionsSettings } from "@components/UserSettings/UserExpressionsSettings";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const ExpressionsSettings = () => {
  const { t } = useTranslation("settings");
  return (
    <SettingsScreen title={t("pages.expressions")} contentStyle={{ flex: 1 }}>
      <UserExpressionsSettings />
    </SettingsScreen>
  );
};

export default observer(ExpressionsSettings);
