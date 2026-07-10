import { BottomSheet } from "@components/Keyboard";
import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";

interface Props {
  onClose: () => void;
}

export const UsernameChangeSheet = observer(({ onClose }: Props) => {
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
    <BottomSheet
      embedded
      open
      onClose={onClose}
      title="Change Username"
      elevation={app.settings?.preferEmbossed ? 4 : 2}
    >
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
      <Box style={{ flexDirection: "row", gap: 8 }}>
        <Button variant="plain" onPress={onClose}>
          Cancel
        </Button>
        <Button disabled={isPending} onPress={() => mutate()}>
          Save
        </Button>
      </Box>
    </BottomSheet>
  );
});
