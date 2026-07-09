import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import { Box, InputPassword, Modal, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const ChangePasswordSheet = observer(({ visible, onClose }: Props) => {
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
      <View pointerEvents="box-none" style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}>
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
            <Typography level="body-lg" weight="bold">
              Change Password
            </Typography>
            <InputPassword
              fullWidth
              placeholder="Current password"
              accessibilityLabel="Current password"
              autoCapitalize="none"
              autoCorrect={false}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <InputPassword
              fullWidth
              placeholder="New password"
              accessibilityLabel="New password"
              autoCapitalize="none"
              autoCorrect={false}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <InputPassword
              fullWidth
              placeholder="Confirm new password"
              accessibilityLabel="Confirm new password"
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
            />
            {error && (
              <Typography color="danger" level="body-sm" accessibilityLiveRegion="polite">
                {error}
              </Typography>
            )}
            <Button disabled={isPending} onPress={() => mutate()}>
              Save
            </Button>
            <Button variant="plain" onPress={onClose}>
              Cancel
            </Button>
          </Paper>
        </AppKeyboardAvoidingView>
      </View>
    </Modal>
  );
});
