import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { UserProfileSettings } from "@components/UserSettings/UserProfileSettings";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const ProfileSettings = () => {
  const { t } = useTranslation("settings");
  return (
    <SettingsScreen title={t("pages.profile")} contentStyle={{ flex: 1 }}>
      <UserProfileSettings />
    </SettingsScreen>
  );
};

export default observer(ProfileSettings);
