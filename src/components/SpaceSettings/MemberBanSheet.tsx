import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import { Box, Button, ButtonGroup, InputDefault, Typography } from "@mutualzz/ui-native";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { Space } from "@stores/objects/Space";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Modal } from "react-native";

const TIMEFRAMES = [
    { label: "Don't delete", value: 0 },
    { label: "Previous hour", value: 3600 },
    { label: "Previous day", value: 86400 },
    { label: "Previous week", value: 604800 },
    { label: "All messages", value: -1 },
] as const;

interface Props {
    visible: boolean;
    onClose: () => void;
    space: Space;
    member: SpaceMember;
}

export const MemberBanSheet = observer(({ visible, onClose, space, member }: Props) => {
    const app = useAppStore();
    const [reason, setReason] = useState("");
    const [timeframe, setTimeframe] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const { mutate, isPending } = useMutation({
        mutationFn: () =>
            app.rest.put(`/spaces/${space.id}/members/${member.userId}/ban`, {
                reason: reason.trim() || "No reason provided",
                deleteMessageTimeframe: timeframe,
            }),
        onSuccess: onClose,
        onError: (err: HttpException) => setError(err.message),
    });

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <Box style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.45)" }}>
                <Paper style={{ padding: 20, borderRadius: 12, gap: 12 }}>
                    <Typography weight="bold">Ban {member.user?.displayName}?</Typography>
                    <InputDefault fullWidth placeholder="Reason" value={reason} onChangeText={setReason} />
                    <ButtonGroup orientation="vertical" spacing={6}>
                        {TIMEFRAMES.map((entry) => (
                            <Button
                                key={entry.label}
                                variant={timeframe === entry.value ? "soft" : "plain"}
                                onPress={() => setTimeframe(entry.value)}
                            >
                                {entry.label}
                            </Button>
                        ))}
                    </ButtonGroup>
                    {error && <Typography color="danger" level="body-sm">{error}</Typography>}
                    <Button color="danger" disabled={isPending || !reason.trim()} onPress={() => mutate()}>Ban</Button>
                    <Button variant="plain" onPress={onClose}>Cancel</Button>
                </Paper>
            </Box>
        </Modal>
    );
});
