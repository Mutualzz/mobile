import { SpaceRoleEditScreen } from "@components/SpaceSettings/SpaceRoleEditScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams } from "expo-router";

const SpaceRoleEditPage = () => {
    const { roleId } = useLocalSearchParams<{ roleId: string }>();
    const { space } = useRequireSpaceSettingsAccess();

    if (!space || !roleId) return null;

    const role = space.roles.get(roleId);
    if (!role) return null;

    return <SpaceRoleEditScreen space={space} role={role} />;
};

export default observer(SpaceRoleEditPage);
