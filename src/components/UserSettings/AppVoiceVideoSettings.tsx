import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { ScrollView } from "react-native";

export const AppVoiceVideoSettings = observer(() => {
    const app = useAppStore();

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
                padding: 16,
                paddingBottom: 32,
            }}
        >
            <Paper
                style={{
                    padding: 16,
                    borderRadius: 12,
                    gap: 12,
                }}
                elevation={app.settings?.preferEmbossed ? 2 : 0}
            >
                <Typography level="body-md" weight={700}>
                    Voice & Video
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    Voice channels and video calls are not available on mobile
                    yet. Device and push-to-talk settings remain on desktop for
                    now.
                </Typography>
            </Paper>
        </ScrollView>
    );
});
