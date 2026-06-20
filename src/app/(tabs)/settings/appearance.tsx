import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { AppAppearanceSettings } from "@components/UserSettings/AppAppearanceSettings";
import { observer } from "mobx-react-lite";

const AppearanceSettings = () => {
    return (
        <SettingsScreen title="Appearance">
            <AppAppearanceSettings />
        </SettingsScreen>
    );
};

export default observer(AppearanceSettings);
