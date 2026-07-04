import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { UserExpressionsSettings } from "@components/UserSettings/UserExpressionsSettings";
import { observer } from "mobx-react-lite";

const ExpressionsSettings = () => {
    return (
        <SettingsScreen title="Expressions">
            <UserExpressionsSettings />
        </SettingsScreen>
    );
};

export default observer(ExpressionsSettings);
