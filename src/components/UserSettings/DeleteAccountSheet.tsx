import { BottomSheet } from "@components/Keyboard";
import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import { Box, Input, InputPassword, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";

interface Props {
  onClose: () => void;
}

export const DeleteAccountSheet = observer(({ onClose }: Props) => {
  const app = useAppStore();
  const account = app.account;
  const [confirmUsername, setConfirmUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      app.rest.post("/@me/delete", {
        confirmUsername: confirmUsername.trim().toLowerCase(),
        password,
      }),
    onSuccess: () => {
      onClose();
      app.logout();
    },
    onError: (err: HttpException) => setError(err.message),
  });

  if (!account) return null;

  const canDelete =
    confirmUsername.trim().toLowerCase() === account.username &&
    password.length > 0;

  return (
    <BottomSheet
      embedded
      open
      onClose={onClose}
      title="Delete account"
      elevation={app.settings?.preferEmbossed ? 4 : 2}
    >
      <Typography level="body-sm" textColor="muted">
        This permanently deactivates your account. Type your username and password
        to confirm.
      </Typography>
      <Input
        fullWidth
        placeholder={`Type ${account.username} to confirm`}
        accessibilityLabel="Confirm username"
        autoCapitalize="none"
        autoCorrect={false}
        value={confirmUsername}
        onChangeText={setConfirmUsername}
      />
      <InputPassword
        fullWidth
        placeholder="Password"
        accessibilityLabel="Password"
        autoCapitalize="none"
        autoCorrect={false}
        value={password}
        onChangeText={setPassword}
      />
      {error && (
        <Typography level="body-sm" color="danger">
          {error}
        </Typography>
      )}
      <Box style={{ flexDirection: "row", gap: 8 }}>
        <Button variant="soft" onPress={onClose} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button
          color="danger"
          disabled={!canDelete || isPending}
          onPress={() => mutate()}
          style={{ flex: 1 }}
        >
          {isPending ? "Deleting..." : "Delete account"}
        </Button>
      </Box>
    </BottomSheet>
  );
});
