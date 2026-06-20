import { SpaceRolesSettings } from "@components/SpaceSettings/SpaceRolesSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { observer } from "mobx-react-lite";

const SpaceRolesSettingsPage = () => {
    const { space } = useRequireSpaceSettingsAccess();
    if (!space) return null;

    return (
        <SpaceSettingsScreen title="Roles" contentStyle={{ flex: 1 }}>
            <SpaceRolesSettings space={space} />
        </SpaceSettingsScreen>
    );
};

export default observer(SpaceRolesSettingsPage);
