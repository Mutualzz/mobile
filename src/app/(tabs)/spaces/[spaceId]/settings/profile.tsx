import { SpaceProfileSettings } from "@components/SpaceSettings/SpaceProfileSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { spacePageTitleKeys } from "@mutualzz/i18n";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

const SpaceProfileSettingsPage = () => {
  const { t } = useTranslation("space");
  const { space } = useRequireSpaceSettingsAccess();
  if (!space) return null;

  return (
    <SpaceSettingsScreen title={t(spacePageTitleKeys.profile)}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <SpaceProfileSettings space={space} />
      </ScrollView>
    </SpaceSettingsScreen>
  );
};

export default observer(SpaceProfileSettingsPage);
