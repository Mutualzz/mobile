import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { UserProfileSettings } from "@components/UserSettings/UserProfileSettings";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

const ProfileSettings = () => {
  const { t } = useTranslation("settings");
  return (
    <SettingsScreen title={t("pages.profile")} contentStyle={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <UserProfileSettings />
      </ScrollView>
    </SettingsScreen>
  );
};

export default observer(ProfileSettings);
