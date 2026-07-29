import { BottomSheet } from "@components/Keyboard";
import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onClose: () => void;
}

export const EmailVerifySheet = observer(({ onClose }: Props) => {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const app = useAppStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => app.rest.post("/@me/verify-email", { code }),
    onSuccess: onClose,
    onError: (err: HttpException) => setError(err.message),
  });

  const { mutate: sendCode, isPending: sendingCode } = useMutation({
    mutationFn: () => app.rest.post("/@me/send-email-code"),
    onError: (err: HttpException) => setError(err.message),
  });

  return (
    <BottomSheet
      embedded
      open
      onClose={onClose}
      title={t("account.verifyEmail")}
      elevation={app.settings?.preferEmbossed ? 4 : 2}
    >
      <InputDefault
        fullWidth
        placeholder={t("account.verificationCode")}
        accessibilityLabel={t("account.verificationCode")}
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
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
      <Button
        variant="soft"
        disabled={sendingCode}
        onPress={() => sendCode()}
      >
        {sendingCode ? t("account.sending") : t("account.sendVerificationCode")}
      </Button>
      <Box style={{ flexDirection: "row", gap: 8 }}>
        <Button variant="plain" onPress={onClose}>
          {tCommon("cancel")}
        </Button>
        <Button disabled={isPending} onPress={() => mutate()}>
          {t("account.verify")}
        </Button>
      </Box>
    </BottomSheet>
  );
});
