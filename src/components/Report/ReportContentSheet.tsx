import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import type {
    HttpException,
    ReportReason,
    ReportTargetType,
} from "@mutualzz/types";
import { reportReasons } from "@mutualzz/validators";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable } from "react-native";

interface Props {
    targetType: ReportTargetType;
    targetId: string;
    contentLabel: string;
    modalId: string;
}

const reasonLabels: Record<ReportReason, string> = {
    spam: "Spam",
    harassment: "Harassment or Abuse",
    hate_speech: "Hate Speech",
    nsfw: "NSFW / Inappropriate Content",
    self_harm: "Self-Harm or Suicide",
    impersonation: "Impersonation",
    misinformation: "Misinformation",
    other: "Other",
};

export const ReportContentSheet = observer(
    ({ targetType, targetId, contentLabel, modalId }: Props) => {
        const app = useAppStore();
        const { closeModal } = useModal();
        const [reason, setReason] = useState<ReportReason>("spam");
        const [description, setDescription] = useState("");
        const [error, setError] = useState<string | null>(null);

        const { mutate: submitReport, isPending } = useMutation({
            mutationKey: ["create-report", targetType, targetId],
            mutationFn: () =>
                app.rest.post("/reports", {
                    targetType,
                    targetId,
                    reason,
                    description: description.trim() || undefined,
                }),
            onSuccess: () => closeModal(modalId),
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
                    Report {contentLabel}
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    Reports are reviewed by staff. Choose the reason that best
                    fits.
                </Typography>

                <Box style={{ gap: 6 }}>
                    {reportReasons.map((r) => (
                        <Pressable key={r} onPress={() => setReason(r)}>
                            <Paper
                                variant={reason === r ? "soft" : "plain"}
                                color={reason === r ? "primary" : "neutral"}
                                style={{ padding: 10, borderRadius: 8 }}
                            >
                                <Typography level="body-sm">
                                    {reasonLabels[r]}
                                </Typography>
                            </Paper>
                        </Pressable>
                    ))}
                </Box>

                <InputDefault
                    fullWidth
                    placeholder="Add more detail (optional)"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                {error && (
                    <Typography level="body-sm" color="danger">
                        {error}
                    </Typography>
                )}

                <Button
                    color="danger"
                    disabled={isPending}
                    onPress={() => submitReport()}
                >
                    {isPending ? "Submitting..." : "Submit Report"}
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
