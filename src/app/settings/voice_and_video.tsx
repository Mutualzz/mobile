import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { AppVoiceVideoSettings } from "@components/UserSettings/AppVoiceVideoSettings";
import { observer } from "mobx-react-lite";

const VoiceVideoSettings = () => {
    return (
        <SettingsScreen title="Voice & Video">
            <AppVoiceVideoSettings />
        </SettingsScreen>
    );
};

export default observer(VoiceVideoSettings);
