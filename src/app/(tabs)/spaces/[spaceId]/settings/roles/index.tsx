import { SpaceRolesSettings } from "@components/SpaceSettings/SpaceRolesSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { spacePageTitleKeys } from "@mutualzz/i18n";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const SpaceRolesSettingsPage = () => {
    const { t } = useTranslation("space");
    const { space } = useRequireSpaceSettingsAccess();
    if (!space) return null;

    return (
        <SpaceSettingsScreen title={t(spacePageTitleKeys.roles)} contentStyle={{ flex: 1 }}>
            <SpaceRolesSettings space={space} />
        </SpaceSettingsScreen>
    );
};

export default observer(SpaceRolesSettingsPage);
