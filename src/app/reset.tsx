import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import { Box, InputPassword, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useState } from "react";

const ResetPassword = () => {
  const app = useAppStore();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate: changePassword, isPending } = useMutation({
    mutationKey: ["reset-password", token],
    mutationFn: () =>
      app.rest.post("/auth/reset-password", {
        token,
        password,
        confirmPassword,
      }),
    onSuccess: () => {
      router.replace("/login");
    },
    onError: (err: HttpException) => {
      setError(err.message);
    },
  });

  if (!token) return <Redirect href="/login" />;

  return (
    <AppKeyboardAvoidingView
      style={{
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
    >
      <Paper
        style={{
          padding: 24,
          borderRadius: 12,
          gap: 16,
        }}
      >
        <Typography level="body-lg" weight="bold">
          Reset Password
        </Typography>
        <Box style={{ gap: 12 }}>
          <InputPassword
            fullWidth
            placeholder="New password"
            value={password}
            onChangeText={setPassword}
          />
          <InputPassword
            fullWidth
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {error && (
            <Typography variant="plain" color="danger" level="body-sm">
              {error}
            </Typography>
          )}
          <Button
            fullWidth
            disabled={isPending || !password || !confirmPassword}
            onPress={() => changePassword()}
          >
            Change password
          </Button>
        </Box>
      </Paper>
    </AppKeyboardAvoidingView>
  );
};

export default observer(ResetPassword);
