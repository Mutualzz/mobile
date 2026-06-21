import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { formatCustomStatusClearLabel, hasCustomStatusContent } from "@utils/customStatus";
import { STATUS_DURATION_OPTIONS } from "@utils/statusDurations";
import { Box, Button, InputDefault, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Modal, ScrollView } from "react-native";

interface Props {
    visible: boolean;
    onClose: () => void;
}

const toDurationValue = (durationMs: number | null) =>
    durationMs == null ? "forever" : String(durationMs);

export const CustomStatusSheet = observer(({ visible, onClose }: Props) => {
    const app = useAppStore();
    const [text, setText] = useState(app.customStatus.effectiveText);
    const [durationValue, setDurationValue] = useState(
        toDurationValue(STATUS_DURATION_OPTIONS[4]?.durationMs ?? 24 * 60 * 60_000),
    );

    const trimmedText = text.trim();
    const canSave =
        hasCustomStatusContent(trimmedText, null) && trimmedText.length <= 128;

    const save = () => {
        if (!canSave) return;
        if (durationValue === "forever") {
            app.gateway.clearScheduledCustomStatus();
            app.gateway.setCustomStatus(trimmedText, { persist: true, emoji: null });
        } else {
            app.gateway.scheduleCustomStatus({
                text: trimmedText,
                emoji: null,
                durationMs: Number(durationValue),
            });
        }
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <Box style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
                <Paper style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, gap: 12, maxHeight: "80%" }}>
                    <Typography level="body-lg" weight="bold">Set your status</Typography>
                    <InputDefault fullWidth placeholder="What's on your mind?" value={text} onChangeText={setText} maxLength={128} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <Box style={{ flexDirection: "row", gap: 8 }}>
                            {STATUS_DURATION_OPTIONS.map((option) => {
                                const value = toDurationValue(option.durationMs);
                                return (
                                    <Button
                                        key={option.label}
                                        size="sm"
                                        variant={durationValue === value ? "soft" : "plain"}
                                        onPress={() => setDurationValue(value)}
                                    >
                                        {formatCustomStatusClearLabel(option.durationMs)}
                                    </Button>
                                );
                            })}
                        </Box>
                    </ScrollView>
                    <Button disabled={!canSave} onPress={save}>Save</Button>
                    <Button variant="plain" onPress={onClose}>Cancel</Button>
                </Paper>
            </Box>
        </Modal>
    );
});
