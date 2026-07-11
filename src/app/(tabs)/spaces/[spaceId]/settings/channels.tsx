import { SpaceChannelsSettings } from "@components/SpaceSettings/SpaceChannelsSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { spacePageTitleKeys } from "@mutualzz/i18n";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const SpaceChannelsSettingsPage = () => {
  const { t } = useTranslation("space");
  const { space } = useRequireSpaceSettingsAccess();
  if (!space) return null;

  return (
    <SpaceSettingsScreen
      title={t(spacePageTitleKeys.channels)}
      contentStyle={{ flex: 1 }}
    >
      <SpaceChannelsSettings space={space} />
    </SpaceSettingsScreen>
  );
};

export default observer(SpaceChannelsSettingsPage);
