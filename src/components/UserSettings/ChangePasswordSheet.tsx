import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import { Box, InputPassword, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Modal } from "react-native";

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
            Change Password
          </Typography>
          <InputPassword
            fullWidth
            placeholder="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <InputPassword
            fullWidth
            placeholder="New password"
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <InputPassword
            fullWidth
            placeholder="Confirm new password"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
          />
          {error && (
            <Typography color="danger" level="body-sm">
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
      </Box>
    </Modal>
  );
});
