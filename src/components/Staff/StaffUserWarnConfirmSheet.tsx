import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import { InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
    userId: string;
    username: string;
    onSuccess: () => void;
    modalId: string;
}

export const StaffUserWarnConfirmSheet = observer(
    ({ userId, username, onSuccess, modalId }: Props) => {
        const { t } = useTranslation("staff");
        const { t: tCommon } = useTranslation("common");
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
                    {t("user.modals.warn.title")}
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    {t("user.modals.warn.body", { username })}
                </Typography>
                <InputDefault
                    fullWidth
                    placeholder={t("user.modals.reasonRequired")}
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
                    {isPending ? t("working") : t("user.modals.warn.submit")}
                </Button>
                <Button
                    variant="soft"
                    color="neutral"
                    disabled={isPending}
                    onPress={() => closeModal(modalId)}
                >
                    {tCommon("cancel")}
                </Button>
            </Paper>
        );
    },
);
