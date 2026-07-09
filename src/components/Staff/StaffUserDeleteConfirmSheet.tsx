import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import type { APIPrivateUser } from "@mutualzz/types";
import { InputDefault, Box, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable } from "react-native";

type DeleteMode = "soft" | "hard";

interface Props {
    userId: string;
    username: string;
    isFounder: boolean;
    allowHardDeleteOnly?: boolean;
    onSoftDeleted: (user: APIPrivateUser) => void;
    onHardDeleted: () => void;
    modalId: string;
}

export const StaffUserDeleteConfirmSheet = observer(
    ({
        userId,
        username,
        isFounder,
        allowHardDeleteOnly = false,
        onSoftDeleted,
        onHardDeleted,
        modalId,
    }: Props) => {
        const app = useAppStore();
        const { closeModal } = useModal();
        const [mode, setMode] = useState<DeleteMode>(
            allowHardDeleteOnly ? "hard" : "soft",
        );
        const [reason, setReason] = useState("");
        const [confirmUsername, setConfirmUsername] = useState("");
        const [error, setError] = useState<string | null>(null);

        const usernameMatches =
            confirmUsername.trim().toLowerCase() === username.toLowerCase();
        const isHardDelete = mode === "hard";

        const { mutate, isPending } = useMutation({
            mutationFn: () =>
                app.rest.post<APIPrivateUser | { success: true; hard: true }>(
                    `/staff/users/${userId}/delete`,
                    {
                        mode,
                        reason: reason.trim(),
                        confirmUsername: confirmUsername.trim().toLowerCase(),
                    },
                ),
            onSuccess: (result) => {
                if ("hard" in result && result.hard) onHardDeleted();
                else onSoftDeleted(result as APIPrivateUser);
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
                    {isHardDelete
                        ? "Hard Delete Account"
                        : "Soft Delete Account"}
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    {isHardDelete
                        ? `This permanently removes @${username}'s account and associated data. Any spaces they own will also be deleted. This cannot be undone.`
                        : `This soft deletes @${username}'s account. They will be signed out and unable to log back in, but their data is retained.`}
                </Typography>
                {isFounder && !allowHardDeleteOnly && (
                    <Box style={{ gap: 8 }}>
                        <Typography level="body-sm" weight={700}>
                            Deletion type
                        </Typography>
                        <Box style={{ flexDirection: "row", gap: 8 }}>
                            <Pressable onPress={() => setMode("soft")}>
                                <Typography
                                    level="body-sm"
                                    color={mode === "soft" ? "primary" : undefined}
                                    textColor={
                                        mode === "soft" ? undefined : "muted"
                                    }
                                >
                                    Soft delete (recommended)
                                </Typography>
                            </Pressable>
                            <Pressable onPress={() => setMode("hard")}>
                                <Typography
                                    level="body-sm"
                                    color={mode === "hard" ? "danger" : undefined}
                                    textColor={
                                        mode === "hard" ? undefined : "muted"
                                    }
                                >
                                    Hard delete
                                </Typography>
                            </Pressable>
                        </Box>
                    </Box>
                )}
                <InputDefault
                    fullWidth
                    placeholder="Reason (required)"
                    value={reason}
                    onChangeText={setReason}
                />
                <InputDefault
                    fullWidth
                    autoCapitalize="none"
                    placeholder={`Type ${username} to confirm`}
                    value={confirmUsername}
                    onChangeText={setConfirmUsername}
                />
                {error && (
                    <Typography color="danger" level="body-sm">
                        {error}
                    </Typography>
                )}
                <Button
                    color="danger"
                    disabled={
                        isPending || !reason.trim() || !usernameMatches
                    }
                    onPress={() => mutate()}
                >
                    {isPending
                        ? "Working..."
                        : isHardDelete
                          ? "Hard Delete Account"
                          : "Soft Delete Account"}
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
