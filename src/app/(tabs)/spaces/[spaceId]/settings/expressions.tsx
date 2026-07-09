import { SpaceEmojisSettings } from "@components/SpaceSettings/SpaceEmojisSettings";
import { SpaceStickersSettings } from "@components/SpaceSettings/SpaceStickersSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { Paper } from "@components/Paper";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { Box, Typography } from "@mutualzz/ui-native";
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
                    gap: 16,
                    paddingBottom: 32,
                }}
            >
                <Paper
                    style={{
                        padding: 12,
                        borderRadius: 12,
                        gap: 4,
                    }}
                >
                    <Typography level="body-md" weight={700}>
                        Space expressions
                    </Typography>
                    <Typography level="body-sm" textColor="muted">
                        Upload and manage custom emoji and stickers for this space.
                    </Typography>
                </Paper>

                <Box style={{ gap: 12 }}>
                    <Typography level="body-md" weight={700}>
                        Emojis
                    </Typography>
                    <SpaceEmojisSettings space={space} />
                </Box>

                <Box style={{ gap: 12 }}>
                    <Typography level="body-md" weight={700}>
                        Stickers
                    </Typography>
                    <SpaceStickersSettings space={space} />
                </Box>
            </ScrollView>
        </SpaceSettingsScreen>
    );
};

export default observer(SpaceExpressionsSettingsPage);
