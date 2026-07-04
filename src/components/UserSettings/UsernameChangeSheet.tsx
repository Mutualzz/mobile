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

export const UsernameChangeSheet = observer(({ visible, onClose }: Props) => {
  const app = useAppStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      app.rest.post("/@me/change-username", { username, password }),
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
            Change Username
          </Typography>
          <InputDefault
            fullWidth
            placeholder="New username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <InputDefault
            fullWidth
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
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
