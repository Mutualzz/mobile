import { Button } from "@components/Button";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import type { APIPrivateUser } from "@mutualzz/types";
import { InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
    userId: string;
    username: string;
    disable: boolean;
    onSuccess: (user: APIPrivateUser) => void;
    sheetId: string;
}

export const StaffUserDisableConfirmSheet = observer(
    ({ userId, username, disable, onSuccess, sheetId }: Props) => {
        const { t } = useTranslation("staff");
        const { t: tCommon } = useTranslation("common");
        const app = useAppStore();
        const { closeSheet } = useSheet();
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
                    {disable
                        ? t("user.modals.disable.title")
                        : t("user.modals.disable.enableTitle")}
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    {disable
                        ? t("user.modals.disable.bodyDisable", { username })
                        : t("user.modals.disable.bodyEnable", { username })}
                </Typography>
                <InputDefault
                    fullWidth
                    placeholder={
                        disable
                            ? t("user.modals.reasonRequired")
                            : t("user.modals.reasonOptional")
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
                        ? t("working")
                        : disable
                          ? t("user.modals.disable.title")
                          : t("user.modals.disable.enableTitle")}
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
