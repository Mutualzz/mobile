import { Button } from "@components/Button";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type {
  APISupportTicket,
  APISupportTicketDetail,
  SupportTicketCategory,
} from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { type Href } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Linking } from "react-native";
import dayjs from "dayjs";

const categoryOptions: { value: SupportTicketCategory; label: string }[] = [
  { value: "account", label: "Account & login" },
  { value: "bug", label: "Bug or crash" },
  { value: "donations", label: "Donations" },
  { value: "feature", label: "Feature request" },
  { value: "other", label: "Other" },
];

const SupportSettings = () => {
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<SupportTicketCategory>("account");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: tickets = [], isFetching } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => app.rest.get<APISupportTicket[]>("/support", { limit: 50 }),
  });

  const { mutate: createTicket, isPending: creating } = useMutation({
    mutationFn: () =>
      app.rest.post<APISupportTicketDetail>("/support", {
        category,
        subject: subject.trim(),
        message: message.trim(),
        platform: Device.osName?.toLowerCase() ?? "mobile",
        appVersion: Constants.expoConfig?.version,
      }),
    onSuccess: (ticket) => {
      setSubject("");
      setMessage("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      navigate(`/settings/support/${ticket.id}` as Href);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    },
  });

  return (
    <SettingsScreen
      title="Help & Support"
      onBack={() => navigate("/settings" as Href)}
    >
      <Box style={{ padding: 16, gap: 16 }}>
        <Typography level="body-sm" textColor="muted">
          Browse help at mutualzz.com/support or contact us below.
        </Typography>
        <Button
          variant="soft"
          onPress={() =>
            Linking.openURL("https://mutualzz.com/support").catch(() => undefined)
          }
        >
          Open help center
        </Button>

        <Box style={{ gap: 8 }}>
          <Typography level="body-md" weight="bold">
            New ticket
          </Typography>
          <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {categoryOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={category === option.value ? "solid" : "soft"}
                onPress={() => setCategory(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </Box>
          <InputDefault
            fullWidth
            placeholder="Subject"
            value={subject}
            onChangeText={setSubject}
          />
          <InputDefault
            fullWidth
            multiline
            placeholder="Describe your issue"
            value={message}
            onChangeText={setMessage}
          />
          {error && (
            <Typography level="body-sm" color="danger">
              {error}
            </Typography>
          )}
          <Button
            disabled={creating || !subject.trim() || !message.trim()}
            onPress={() => createTicket()}
          >
            {creating ? "Submitting..." : "Submit ticket"}
          </Button>
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-md" weight="bold">
            My tickets
          </Typography>
          {isFetching && (
            <Typography level="body-sm" textColor="muted">
              Loading...
            </Typography>
          )}
          {!isFetching && tickets.length === 0 && (
            <Typography level="body-sm" textColor="muted">
              No tickets yet
            </Typography>
          )}
          {tickets.map((ticket) => (
            <Button
              key={ticket.id}
              variant="soft"
              horizontalAlign="left"
              onPress={() =>
                navigate(`/settings/support/${ticket.id}` as Href)
              }
            >
              <Box style={{ gap: 2 }}>
                <Typography weight="bold">{ticket.subject}</Typography>
                <Typography level="body-xs" textColor="muted">
                  {ticket.status.replace("_", " ")} ·{" "}
                  {dayjs(ticket.lastMessageAt).format("MMM D, h:mm A")}
                </Typography>
              </Box>
            </Button>
          ))}
        </Box>
      </Box>
    </SettingsScreen>
  );
};

export default observer(SupportSettings);
