import { SpaceProfileSettings } from "@components/SpaceSettings/SpaceProfileSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { observer } from "mobx-react-lite";
import { ScrollView } from "react-native";

const SpaceProfileSettingsPage = () => {
  const { space } = useRequireSpaceSettingsAccess();
  if (!space) return null;

  return (
    <SpaceSettingsScreen title="Profile">
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
