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
                gap: 16,
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
                    Voice channels
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    Voice channels are available on mobile with live participant
                    sync. Full WebRTC audio transport via react-native-webrtc is
                    the next integration step after the current gateway spike.
                </Typography>
            </Paper>

            <Paper
                style={{
                    padding: 16,
                    borderRadius: 12,
                    gap: 12,
                }}
                elevation={app.settings?.preferEmbossed ? 2 : 0}
            >
                <Typography level="body-md" weight={700}>
                    Camera and screen share
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    Camera preview and screen sharing remain desktop-only for
                    now. Mobile focuses on joining voice channels and seeing
                    who is connected.
                </Typography>
            </Paper>
        </ScrollView>
    );
});
