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
import { useTranslation } from "react-i18next";

const SubmitAppeal = () => {
  const { t } = useTranslation("auth");
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
          {t("appeal.title")}
        </Typography>
        {isSuccess ? (
          <Typography textColor="secondary">{t("appeal.success")}</Typography>
        ) : (
          <Box style={{ gap: 12 }}>
            <Typography textColor="secondary">
              {t("appeal.descriptionShort")}
            </Typography>
            <InputDefault
              fullWidth
              multiline
              placeholder={t("appeal.placeholder")}
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
              {t("actions.submitAppeal")}
            </Button>
          </Box>
        )}
      </Paper>
    </KeyboardForm>
  );
};

export default observer(SubmitAppeal);
