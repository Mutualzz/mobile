import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import { Box, Input, InputPassword, Modal, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const DeleteAccountSheet = observer(({ visible, onClose }: Props) => {
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
    confirmUsername.trim().toLowerCase() === account.username && password.length > 0;

  return (
    <Modal
      open={visible}
      onClose={onClose}
      layout="fullscreen"
      showCloseButton={false}
      style={{
        justifyContent: "flex-end",
        alignItems: "stretch",
        backgroundColor: "transparent",
        paddingVertical: 0,
      }}
    >
      <View
        pointerEvents="box-none"
        style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}
      >
        <AppKeyboardAvoidingView>
          <Paper
            elevation={app.settings?.preferEmbossed ? 4 : 2}
            style={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              gap: 12,
            }}
          >
            <Typography level="body-lg" weight="bold" color="danger">
              Delete account
            </Typography>
            <Typography level="body-sm" textColor="muted">
              This permanently deactivates your account. Type your username and
              password to confirm.
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
          </Paper>
        </AppKeyboardAvoidingView>
      </View>
    </Modal>
  );
});
