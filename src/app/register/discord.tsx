import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import type { HttpException } from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const RegisterDiscordRoute = () => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const router = useRouter();
  const { pending } = useLocalSearchParams<{ pending?: string }>();
  const [username, setUsername] = useState("");
  const [globalName, setGlobalName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      app.rest.post<{ token: string }>("auth/discord/complete", {
        pendingId: pending,
        username,
        globalName: globalName || undefined,
        dateOfBirth,
      }),
    onSuccess: ({ token }) => {
      app.setToken(token);
      router.replace("/");
    },
    onError: (err: HttpException) => setError(err.message),
  });

  if (!pending) {
    return (
      <Box style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Typography>{t("discordAuth.invalidCallback")}</Typography>
      </Box>
    );
  }

  return (
    <Box style={{ flex: 1, justifyContent: "center", padding: 16 }}>
      <Paper style={{ padding: 20, gap: 16 }}>
        <Typography level="h5">{t("discordAuth.completeTitle")}</Typography>
        <Typography textColor="muted" level="body-sm">
          {t("discordAuth.completeDescription")}
        </Typography>
        <Box style={{ gap: 12 }}>
          <Box style={{ gap: 4 }}>
            <Typography level="body-sm" weight={500}>
              {t("discordAuth.username")}
            </Typography>
            <InputDefault
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              fullWidth
            />
          </Box>
          <Box style={{ gap: 4 }}>
            <Typography level="body-sm" weight={500}>
              {t("discordAuth.displayName")}
            </Typography>
            <InputDefault
              value={globalName}
              onChangeText={setGlobalName}
              fullWidth
            />
          </Box>
          <Box style={{ gap: 4 }}>
            <Typography level="body-sm" weight={500}>
              {t("discordAuth.dateOfBirth")}
            </Typography>
            <InputDefault
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder={t("discordAuth.dateOfBirthPlaceholder")}
              fullWidth
            />
          </Box>
          {error && (
            <Typography color="danger" level="body-sm">
              {error}
            </Typography>
          )}
          <Button
            disabled={isPending || !username || !dateOfBirth}
            onPress={() => mutate()}
          >
            {t("discordAuth.finishSignup")}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default observer(RegisterDiscordRoute);
