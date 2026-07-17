import { SpaceThemeSettings } from "@components/SpaceSettings/SpaceThemeSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { spacePageTitleKeys } from "@mutualzz/i18n";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const SpaceThemeSettingsPage = () => {
  const { t } = useTranslation("space");
  const { space } = useRequireSpaceSettingsAccess();
  if (!space) return null;

  return (
    <SpaceSettingsScreen title={t(spacePageTitleKeys.theme)}>
      <SpaceThemeSettings space={space} />
    </SpaceSettingsScreen>
  );
};

export default observer(SpaceThemeSettingsPage);
