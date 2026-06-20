import { SpaceBansSettings } from "@components/SpaceSettings/SpaceBansSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { observer } from "mobx-react-lite";

const SpaceBansSettingsPage = () => {
    const { space } = useRequireSpaceSettingsAccess();
    if (!space) return null;

    return (
        <SpaceSettingsScreen title="Bans" contentStyle={{ flex: 1 }}>
            <SpaceBansSettings space={space} />
        </SpaceSettingsScreen>
    );
};

export default observer(SpaceBansSettingsPage);
