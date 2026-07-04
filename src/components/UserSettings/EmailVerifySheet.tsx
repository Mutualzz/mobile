import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Modal } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const EmailVerifySheet = observer(({ visible, onClose }: Props) => {
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
    <Modal visible={visible} animationType="slide" transparent>
      <Box
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.45)",
        }}
      >
        <Paper
          elevation={app.settings?.preferEmbossed ? 4 : 2}
          style={{
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 20,
            gap: 12,
          }}
        >
          <Typography level="body-lg" weight="bold">
            Verify Email
          </Typography>
          <InputDefault
            fullWidth
            placeholder="Verification code"
            value={code}
            onChangeText={setCode}
          />
          {error && (
            <Typography color="danger" level="body-sm">
              {error}
            </Typography>
          )}
          <Button
            variant="soft"
            disabled={sendingCode}
            onPress={() => sendCode()}
          >
            {sendingCode ? "Sending..." : "Send verification code"}
          </Button>
          <Button disabled={isPending} onPress={() => mutate()}>
            Verify
          </Button>
          <Button variant="plain" onPress={onClose}>
            Cancel
          </Button>
        </Paper>
      </Box>
    </Modal>
  );
});
