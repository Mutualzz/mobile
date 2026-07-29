import { Button } from "@components/Button";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import type { APIPrivateUser } from "@mutualzz/types";
import { InputDefault, Box, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

type DeleteMode = "soft" | "hard";

interface Props {
    userId: string;
    username: string;
    isFounder: boolean;
    allowHardDeleteOnly?: boolean;
    onSoftDeleted: (user: APIPrivateUser) => void;
    onHardDeleted: () => void;
    sheetId: string;
}

export const StaffUserDeleteConfirmSheet = observer(
    ({
        userId,
        username,
        isFounder,
        allowHardDeleteOnly = false,
        onSoftDeleted,
        onHardDeleted,
        sheetId,
    }: Props) => {
        const { t } = useTranslation("staff");
        const { t: tCommon } = useTranslation("common");
        const app = useAppStore();
        const { closeSheet } = useSheet();
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
                    {isHardDelete
                        ? t("user.modals.delete.hardTitle")
                        : t("user.modals.delete.softTitle")}
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    {isHardDelete
                        ? t("user.modals.delete.hardBody", { username })
                        : t("user.modals.delete.softBody", { username })}
                </Typography>
                {isFounder && !allowHardDeleteOnly && (
                    <Box style={{ gap: 8 }}>
                        <Typography level="body-sm" weight={700}>
                            {t("user.modals.delete.type")}
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
                                    {t("user.modals.delete.softOption")}
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
                                    {t("user.modals.delete.hardOption")}
                                </Typography>
                            </Pressable>
                        </Box>
                    </Box>
                )}
                <InputDefault
                    fullWidth
                    placeholder={t("user.modals.reasonRequired")}
                    value={reason}
                    onChangeText={setReason}
                />
                <InputDefault
                    fullWidth
                    autoCapitalize="none"
                    placeholder={t("user.modals.delete.confirmUsername", {
                        username,
                    })}
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
                        ? t("working")
                        : isHardDelete
                          ? t("user.modals.delete.hardTitle")
                          : t("user.modals.delete.softTitle")}
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
