import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import type { APIPrivateUser, HttpException } from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

interface Props {
    userId: string;
    username: string;
    onSuccess: (user: APIPrivateUser) => void;
    sheetId: string;
}

const durationOptions = [
    { value: 1, key: "1h" },
    { value: 6, key: "6h" },
    { value: 24, key: "1d" },
    { value: 72, key: "3d" },
    { value: 168, key: "7d" },
    { value: 720, key: "30d" },
] as const;

export const StaffUserRestrictConfirmSheet = observer(
    ({ userId, onSuccess, sheetId }: Props) => {
        const { t } = useTranslation("staff");
        const { t: tCommon } = useTranslation("common");
        const app = useAppStore();
        const { closeSheet } = useSheet();
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
                    {t("user.modals.restrict.title")}
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    {t("user.modals.restrict.body")}
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
                                    {t(`user.modals.restrict.durations.${o.key}`)}
                                </Typography>
                            </Paper>
                        </Pressable>
                    ))}
                </Box>

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
                    {isPending
                        ? t("working")
                        : t("user.modals.restrict.submit")}
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
