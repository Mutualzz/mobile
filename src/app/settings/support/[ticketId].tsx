import { Button } from "@components/Button";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { APISupportTicketDetail } from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Href, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const SupportTicketScreen = () => {
  const { t } = useTranslation("common");
  const { t: tSettings } = useTranslation("settings");
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const queryClient = useQueryClient();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queryKey = ["support-ticket", ticketId];

  const { data: ticket, isLoading } = useQuery({
    queryKey,
    enabled: !!ticketId,
    queryFn: () =>
      app.rest.get<APISupportTicketDetail>(`/support/${ticketId}`),
  });

  const { mutate: sendReply, isPending: sending } = useMutation({
    mutationFn: () =>
      app.rest.post<APISupportTicketDetail>(`/support/${ticketId}/messages`, {
        message: reply.trim(),
      }),
    onSuccess: (updated) => {
      setReply("");
      setError(null);
      queryClient.setQueryData(queryKey, updated);
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err) => {
      setError(
        err instanceof Error ? err.message : t("support.sendReplyFailed"),
      );
    },
  });

  const isClosed =
    ticket?.status === "closed" || ticket?.status === "resolved";

  return (
    <SettingsScreen
      title={ticket?.subject ?? t("support.myTickets")}
      onBack={() => navigate("/settings/support" as Href)}
    >
      <Box style={{ padding: 16, gap: 12 }}>
        {isLoading && (
          <Typography level="body-sm" textColor="muted">
            {t("support.loading")}
          </Typography>
        )}

        {ticket?.messages.map((message) => (
          <Box
            key={message.id}
            style={{
              gap: 4,
              alignSelf: message.isStaff ? "flex-start" : "flex-end",
              maxWidth: "100%",
            }}
          >
            <Typography level="body-xs" textColor="muted">
              {message.isStaff
                ? t("support.staffLabel")
                : message.author.globalName || message.author.username}{" "}
              · {dayjs(message.createdAt).format("MMM D, h:mm A")}
            </Typography>
            <Typography>{message.body}</Typography>
          </Box>
        ))}

        {!isClosed && ticket && (
          <Box style={{ gap: 8 }}>
            <InputDefault
              fullWidth
              multiline
              placeholder={t("support.writeReply")}
              value={reply}
              onChangeText={setReply}
            />
            {error && (
              <Typography level="body-sm" color="danger">
                {error}
              </Typography>
            )}
            <Button
              disabled={sending || !reply.trim()}
              onPress={() => sendReply()}
            >
              {sending
                ? tSettings("account.sending")
                : t("support.sendReply")}
            </Button>
          </Box>
        )}

        {isClosed && (
          <Typography level="body-sm" textColor="muted">
            {t("support.ticketClosed")}
          </Typography>
        )}
      </Box>
    </SettingsScreen>
  );
};

export default observer(SupportTicketScreen);
