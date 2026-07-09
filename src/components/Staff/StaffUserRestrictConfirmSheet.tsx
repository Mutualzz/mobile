import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import type { APIPrivateUser, HttpException } from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable } from "react-native";

interface Props {
    userId: string;
    username: string;
    onSuccess: (user: APIPrivateUser) => void;
    modalId: string;
}

const durationOptions = [
    { value: 1, label: "1 hour" },
    { value: 6, label: "6 hours" },
    { value: 24, label: "1 day" },
    { value: 72, label: "3 days" },
    { value: 168, label: "7 days" },
    { value: 720, label: "30 days" },
];

export const StaffUserRestrictConfirmSheet = observer(
    ({ userId, username, onSuccess, modalId }: Props) => {
        const app = useAppStore();
        const { closeModal } = useModal();
        const [hours, setHours] = useState(24);
        const [reason, setReason] = useState("");
        const [error, setError] = useState<string | null>(null);

        const { mutate, isPending } = useMutation({
            mutationFn: () =>
                app.rest.patch<APIPrivateUser>(
                    `/staff/users/${userId}/restrict`,
                    { hours, reason: reason.trim() },
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
                    Restrict User
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    @{username} won&apos;t be able to send messages, create
                    posts, or comment until the restriction expires or is
                    lifted early.
                </Typography>

                <Box style={{ gap: 6 }}>
                    {durationOptions.map((o) => (
                        <Pressable key={o.value} onPress={() => setHours(o.value)}>
                            <Paper
                                variant={hours === o.value ? "soft" : "plain"}
                                color={hours === o.value ? "primary" : "neutral"}
                                style={{ padding: 10, borderRadius: 8 }}
                            >
                                <Typography level="body-sm">
                                    {o.label}
                                </Typography>
                            </Paper>
                        </Pressable>
                    ))}
                </Box>

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
                    {isPending ? "Working..." : "Restrict"}
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
