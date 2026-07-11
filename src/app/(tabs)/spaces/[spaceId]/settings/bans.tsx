import { SpaceBansSettings } from "@components/SpaceSettings/SpaceBansSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { spacePageTitleKeys } from "@mutualzz/i18n";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const SpaceBansSettingsPage = () => {
    const { t } = useTranslation("space");
    const { space } = useRequireSpaceSettingsAccess();
    if (!space) return null;

    return (
        <SpaceSettingsScreen title={t(spacePageTitleKeys.bans)} contentStyle={{ flex: 1 }}>
            <SpaceBansSettings space={space} />
        </SpaceSettingsScreen>
    );
};

export default observer(SpaceBansSettingsPage);
