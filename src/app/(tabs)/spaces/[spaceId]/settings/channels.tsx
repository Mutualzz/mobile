import { SpaceChannelsSettings } from "@components/SpaceSettings/SpaceChannelsSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { observer } from "mobx-react-lite";

const SpaceChannelsSettingsPage = () => {
    const { space } = useRequireSpaceSettingsAccess();
    if (!space) return null;

    return (
        <SpaceSettingsScreen title="Channels" contentStyle={{ flex: 1 }}>
            <SpaceChannelsSettings space={space} />
        </SpaceSettingsScreen>
    );
};

export default observer(SpaceChannelsSettingsPage);
