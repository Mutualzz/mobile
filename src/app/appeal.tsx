import { KeyboardForm } from "@components/Keyboard";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { Redirect, useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";
import { useState } from "react";

const SubmitAppeal = () => {
  const app = useAppStore();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    mutate: submitAppeal,
    isPending,
    isSuccess,
  } = useMutation({
    mutationKey: ["submit-appeal", token],
    mutationFn: () =>
      app.rest.post("/appeals", {
        token,
        message: message.trim(),
      }),
    onError: (err: HttpException) => {
      setError(err.message);
    },
  });

  if (!token) return <Redirect href="/login" />;

  return (
    <KeyboardForm
      style={{
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
      contentContainerStyle={{ justifyContent: "center" }}
    >
      <Paper
        style={{
          padding: 24,
          borderRadius: 12,
          gap: 16,
        }}
      >
        <Typography level="body-lg" weight="bold">
          Submit an Appeal
        </Typography>
        {isSuccess ? (
          <Typography textColor="secondary">
            Your appeal has been submitted. Our staff team will review it and
            follow up by email.
          </Typography>
        ) : (
          <Box style={{ gap: 12 }}>
            <Typography textColor="secondary">
              Explain why you believe this decision should be reconsidered. A
              staff member will review your appeal.
            </Typography>
            <InputDefault
              fullWidth
              multiline
              placeholder="Tell us why this decision should be reconsidered"
              value={message}
              onChangeText={setMessage}
            />
            {error && (
              <Typography variant="plain" color="danger" level="body-sm">
                {error}
              </Typography>
            )}
            <Button
              fullWidth
              disabled={isPending || !message.trim()}
              onPress={() => submitAppeal()}
            >
              Submit Appeal
            </Button>
          </Box>
        )}
      </Paper>
    </KeyboardForm>
  );
};

export default observer(SubmitAppeal);
