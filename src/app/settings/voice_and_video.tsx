import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { AppVoiceVideoSettings } from "@components/UserSettings/AppVoiceVideoSettings";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const VoiceVideoSettings = () => {
  const { t } = useTranslation("settings");
  return (
    <SettingsScreen title={t("pages.voiceAndVideo")}>
      <AppVoiceVideoSettings />
    </SettingsScreen>
  );
};

export default observer(VoiceVideoSettings);
