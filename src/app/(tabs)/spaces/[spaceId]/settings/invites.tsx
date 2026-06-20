import { SpaceInvitesSettings } from "@components/SpaceSettings/SpaceInvitesSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { observer } from "mobx-react-lite";

const SpaceInvitesSettingsPage = () => {
    const { space } = useRequireSpaceSettingsAccess();
    if (!space) return null;

    return (
        <SpaceSettingsScreen title="Invites" contentStyle={{ flex: 1 }}>
            <SpaceInvitesSettings space={space} />
        </SpaceSettingsScreen>
    );
};

export default observer(SpaceInvitesSettingsPage);
