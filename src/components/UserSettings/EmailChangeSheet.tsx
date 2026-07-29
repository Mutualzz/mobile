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

export const EmailChangeSheet = observer(({ onClose }: Props) => {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const app = useAppStore();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const verified = app.account?.flags.has("Verified");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      verified
        ? app.rest.post("/@me/change-email", { code, email })
        : app.rest.post("/@me/change-email-unverified", { email }),
    onSuccess: onClose,
    onError: (err: HttpException) => setError(err.message),
  });

  return (
    <BottomSheet
      embedded
      open
      onClose={onClose}
      title={t("account.changeEmail")}
      elevation={app.settings?.preferEmbossed ? 4 : 2}
    >
      {verified && (
        <InputDefault
          fullWidth
          placeholder={t("account.verificationCode")}
          accessibilityLabel={t("account.verificationCode")}
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />
      )}
      <InputDefault
        fullWidth
        placeholder={t("account.newEmailShort")}
        accessibilityLabel={t("account.newEmailShort")}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
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
