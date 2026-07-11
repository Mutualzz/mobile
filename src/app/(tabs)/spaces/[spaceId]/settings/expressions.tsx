import { SpaceEmojisSettings } from "@components/SpaceSettings/SpaceEmojisSettings";
import { SpaceStickersSettings } from "@components/SpaceSettings/SpaceStickersSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { Paper } from "@components/Paper";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { spacePageTitleKeys } from "@mutualzz/i18n";
import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

const SpaceExpressionsSettingsPage = () => {
    const { t } = useTranslation("space");
    const { t: tSettings } = useTranslation("settings");
    const { space } = useRequireSpaceSettingsAccess();
    if (!space) return null;

    return (
        <SpaceSettingsScreen title={t(spacePageTitleKeys.expressions)} contentStyle={{ flex: 1 }}>
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
                        {t("expressions.pageTitle")}
                    </Typography>
                    <Typography level="body-sm" textColor="muted">
                        {t("expressions.pageDescription")}
                    </Typography>
                </Paper>

                <Box style={{ gap: 12 }}>
                    <Typography level="body-md" weight={700}>
                        {tSettings("expressions.emojis")}
                    </Typography>
                    <SpaceEmojisSettings space={space} />
                </Box>

                <Box style={{ gap: 12 }}>
                    <Typography level="body-md" weight={700}>
                        {tSettings("expressions.stickers")}
                    </Typography>
                    <SpaceStickersSettings space={space} />
                </Box>
            </ScrollView>
        </SpaceSettingsScreen>
    );
};

export default observer(SpaceExpressionsSettingsPage);
