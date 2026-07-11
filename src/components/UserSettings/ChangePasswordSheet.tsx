import { BottomSheet } from "@components/Keyboard";
import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import { Box, InputPassword, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onClose: () => void;
}

export const ChangePasswordSheet = observer(({ onClose }: Props) => {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const app = useAppStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      app.rest.post("/@me/change-password", {
        currentPassword,
        newPassword,
        confirmNewPassword,
      }),
    onSuccess: onClose,
    onError: (err: HttpException) => setError(err.message),
  });

  return (
    <BottomSheet
      embedded
      open
      onClose={onClose}
      title={t("account.changePassword")}
      elevation={app.settings?.preferEmbossed ? 4 : 2}
    >
      <InputPassword
        fullWidth
        placeholder={t("account.currentPasswordShort")}
        accessibilityLabel={t("account.currentPasswordShort")}
        autoCapitalize="none"
        autoCorrect={false}
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <InputPassword
        fullWidth
        placeholder={t("account.newPassword")}
        accessibilityLabel={t("account.newPassword")}
        autoCapitalize="none"
        autoCorrect={false}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <InputPassword
        fullWidth
        placeholder={t("account.confirmNewPassword")}
        accessibilityLabel={t("account.confirmNewPassword")}
        autoCapitalize="none"
        autoCorrect={false}
        value={confirmNewPassword}
        onChangeText={setConfirmNewPassword}
      />
      {error && (
        <Typography
          color="danger"
          level="body-sm"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Typography>
      )}
      <Box style={{ flexDirection: "row", gap: 8 }}>
        <Button variant="plain" onPress={onClose}>
          {tCommon("cancel")}
        </Button>
        <Button disabled={isPending} onPress={() => mutate()}>
          {tCommon("save")}
        </Button>
      </Box>
    </BottomSheet>
  );
});
