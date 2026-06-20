import { SpaceEmojisSettings } from "@components/SpaceSettings/SpaceEmojisSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { observer } from "mobx-react-lite";
import { ScrollView } from "react-native";

const SpaceExpressionsSettingsPage = () => {
    const { space } = useRequireSpaceSettingsAccess();
    if (!space) return null;

    return (
        <SpaceSettingsScreen title="Expressions" contentStyle={{ flex: 1 }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 32,
                }}
            >
                <SpaceEmojisSettings space={space} />
            </ScrollView>
        </SpaceSettingsScreen>
    );
};

export default observer(SpaceExpressionsSettingsPage);
