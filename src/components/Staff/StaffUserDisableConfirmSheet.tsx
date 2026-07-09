import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import type { APIPrivateUser } from "@mutualzz/types";
import { InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";

interface Props {
    userId: string;
    username: string;
    disable: boolean;
    onSuccess: (user: APIPrivateUser) => void;
    modalId: string;
}

export const StaffUserDisableConfirmSheet = observer(
    ({ userId, username, disable, onSuccess, modalId }: Props) => {
        const app = useAppStore();
        const { closeModal } = useModal();
        const [reason, setReason] = useState("");
        const [error, setError] = useState<string | null>(null);

        const { mutate, isPending } = useMutation({
            mutationFn: () =>
                app.rest.patch<APIPrivateUser>(
                    `/staff/users/${userId}/disabled`,
                    { disabled: disable, reason: reason.trim() || undefined },
                ),
            onSuccess: (user) => {
                onSuccess(user);
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
                    {disable ? "Disable Account" : "Enable Account"}
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    Are you sure you want to {disable ? "disable" : "re-enable"}{" "}
                    @{username}&apos;s account?
                    {disable &&
                        " They will be signed out and unable to log back in until re-enabled."}
                </Typography>
                <InputDefault
                    fullWidth
                    placeholder={
                        disable
                            ? "Reason (required)"
                            : "Reason (optional)"
                    }
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
                    disabled={isPending || (disable && !reason.trim())}
                    onPress={() => mutate()}
                >
                    {isPending
                        ? "Working..."
                        : disable
                          ? "Disable Account"
                          : "Enable Account"}
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
