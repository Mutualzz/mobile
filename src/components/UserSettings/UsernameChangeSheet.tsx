import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import { Box, InputDefault, Modal, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { View } from "react-native";

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
              Change Username
            </Typography>
            <InputDefault
              fullWidth
              placeholder="New username"
              accessibilityLabel="New username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <InputDefault
              fullWidth
              placeholder="Password"
              accessibilityLabel="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
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
