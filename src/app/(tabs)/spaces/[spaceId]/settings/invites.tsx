import { SpaceInvitesSettings } from "@components/SpaceSettings/SpaceInvitesSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { spacePageTitleKeys } from "@mutualzz/i18n";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const SpaceInvitesSettingsPage = () => {
    const { t } = useTranslation("space");
    const { space } = useRequireSpaceSettingsAccess();
    if (!space) return null;

    return (
        <SpaceSettingsScreen title={t(spacePageTitleKeys.invites)} contentStyle={{ flex: 1 }}>
            <SpaceInvitesSettings space={space} />
        </SpaceSettingsScreen>
    );
};

export default observer(SpaceInvitesSettingsPage);
