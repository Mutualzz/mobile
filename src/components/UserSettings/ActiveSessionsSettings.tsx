import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import {
  fetchMeSessions,
  formatRestError,
  ME_SESSIONS_QUERY_KEY,
  revokeMeSession,
  revokeOtherMeSessions,
} from "@mutualzz/client";
import { Box, Typography } from "@mutualzz/ui-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export const ActiveSessionsSettings = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ME_SESSIONS_QUERY_KEY,
    queryFn: () => fetchMeSessions(app),
  });

  const { mutate: revokeSession, isPending: revokingSession } = useMutation({
    mutationFn: (sessionId: string) => revokeMeSession(app, sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ME_SESSIONS_QUERY_KEY });
      Alert.alert(t("account.sessionRevoked"));
    },
    onError: (error) => {
      Alert.alert(
        formatRestError(error, t("account.sessionRevokeError")),
      );
    },
  });

  const { mutate: revokeOthers, isPending: revokingOthers } = useMutation({
    mutationFn: () => revokeOtherMeSessions(app),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ME_SESSIONS_QUERY_KEY });
      Alert.alert(t("account.otherSessionsRevoked"));
    },
    onError: (error) => {
      Alert.alert(
        formatRestError(error, t("account.otherSessionsRevokeError")),
      );
    },
  });

  const otherSessions = sessions.filter((session) => !session.current);
  const isPending = revokingSession || revokingOthers;

  const handleRevokeOthers = () => {
    Alert.alert(
      t("account.logoutOtherSessions"),
      t("account.logoutOtherSessionsConfirm"),
      [
        { text: t("common:cancel"), style: "cancel" },
        {
          text: t("account.logoutOtherSessions"),
          style: "destructive",
          onPress: () => revokeOthers(),
        },
      ],
    );
  };

  return (
    <>
      {isLoading ? (
        <Typography level="body-sm" textColor="muted">
          {t("account.loadingSessions")}
        </Typography>
      ) : sessions.length === 0 ? (
        <Typography level="body-sm" textColor="muted">
          {t("account.noSessions")}
        </Typography>
      ) : (
        <Box style={{ gap: 10 }}>
          {otherSessions.length > 0 && (
            <Button
              size="sm"
              variant="outlined"
              color="danger"
              disabled={isPending}
              onPress={handleRevokeOthers}
              style={{ alignSelf: "flex-start" }}
            >
              {t("account.logoutOtherSessions")}
            </Button>
          )}
          {sessions.map((session) => (
            <Box
              key={session.sessionId}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Box style={{ flex: 1, gap: 2 }}>
                <Typography level="body-sm" weight={600}>
                  {session.current
                    ? t("account.currentSession")
                    : t("account.otherSession")}
                </Typography>
                <Typography level="body-xs" textColor="muted">
                  {t("account.sessionLastActive", {
                    time: dayjs(session.lastUsedAt).fromNow(),
                  })}
                </Typography>
              </Box>
              {!session.current && (
                <Button
                  size="sm"
                  variant="outlined"
                  color="danger"
                  disabled={isPending}
                  onPress={() => revokeSession(session.sessionId)}
                >
                  {t("account.revokeSession")}
                </Button>
              )}
            </Box>
          ))}
        </Box>
      )}
    </>
  );
});
