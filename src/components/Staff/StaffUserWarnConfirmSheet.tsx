import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import { InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";

interface Props {
    userId: string;
    username: string;
    onSuccess: () => void;
    modalId: string;
}

export const StaffUserWarnConfirmSheet = observer(
    ({ userId, username, onSuccess, modalId }: Props) => {
        const app = useAppStore();
        const { closeModal } = useModal();
        const [reason, setReason] = useState("");
        const [error, setError] = useState<string | null>(null);

        const { mutate, isPending } = useMutation({
            mutationFn: () =>
                app.rest.post<{ success: boolean; emailSent: boolean }>(
                    `/staff/users/${userId}/warn`,
                    { reason: reason.trim() },
                ),
            onSuccess: () => {
                onSuccess();
                closeModal(modalId);
            },
            onError: (err: HttpException) => setError(err.message),
        });

        return (
            <Paper
                style={{
                    width: 320,
                    maxWidth: "100%",
                    padding: 16,
                    borderRadius: 12,
                    gap: 12,
                }}
                elevation={app.settings?.preferEmbossed ? 4 : 2}
            >
                <Typography level="body-md" weight={700}>
                    Warn User
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    This sends @{username} a warning email and logs it to
                    their audit trail. It doesn't change their account state.
                </Typography>
                <InputDefault
                    fullWidth
                    placeholder="Reason (required)"
                    value={reason}
                    onChangeText={setReason}
                />
                {error && (
                    <Typography color="danger" level="body-sm">
                        {error}
                    </Typography>
                )}
                <Button
                    color="danger"
                    disabled={isPending || !reason.trim()}
                    onPress={() => mutate()}
                >
                    {isPending ? "Working..." : "Send Warning"}
                </Button>
                <Button
                    variant="soft"
                    color="neutral"
                    disabled={isPending}
                    onPress={() => closeModal(modalId)}
                >
                    Cancel
                </Button>
            </Paper>
        );
    },
);
