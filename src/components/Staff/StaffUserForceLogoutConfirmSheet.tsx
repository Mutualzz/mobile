import { Button } from "@components/Button";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import { InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
    userId: string;
    username: string;
    onSuccess: () => void;
    sheetId: string;
}

export const StaffUserForceLogoutConfirmSheet = observer(
    ({ userId, username, onSuccess, sheetId }: Props) => {
        const { t } = useTranslation("staff");
        const { t: tCommon } = useTranslation("common");
        const app = useAppStore();
        const { closeSheet } = useSheet();
        const [reason, setReason] = useState("");
        const [error, setError] = useState<string | null>(null);

        const { mutate, isPending } = useMutation({
            mutationFn: () =>
                app.rest.post(`/staff/users/${userId}/force-logout`, {
                    reason: reason.trim() || undefined,
                }),
            onSuccess: () => {
                onSuccess();
                closeSheet(sheetId);
            },
            onError: (err: HttpException) => setError(err.message),
        });

        return (
            <View
                style={{
                    width: "100%",
                    padding: 16,
                    gap: 12,
                }}
            >
                <Typography level="body-md" weight={700}>
                    {t("user.modals.forceLogout.title")}
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    {t("user.modals.forceLogout.body", { username })}
                </Typography>
                <InputDefault
                    fullWidth
                    placeholder={t("user.modals.reasonOptional")}
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
                    disabled={isPending}
                    onPress={() => mutate()}
                >
                    {isPending
                        ? t("working")
                        : t("user.modals.forceLogout.title")}
                </Button>
                <Button
                    variant="soft"
                    color="neutral"
                    disabled={isPending}
                    onPress={() => closeSheet(sheetId)}
                >
                    {tCommon("cancel")}
                </Button>
            </View>
        );
    },
);
