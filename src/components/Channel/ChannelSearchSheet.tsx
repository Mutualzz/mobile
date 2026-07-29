import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { MessageSearchFilterChips } from "@components/Channel/MessageSearchFilterChips";
import { useAppStore } from "@hooks/useStores";
import type { APIMessage } from "@mutualzz/types";
import { isMessageSearchQueryReady } from "@mutualzz/validators";
import { Box, Button, InputDefault, Sheet, Typography, useTheme } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

interface Props {
  channel: Channel;
  visible: boolean;
  onClose: () => void;
}

export const ChannelSearchSheet = observer(({ channel, visible, onClose }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { t } = useTranslation("chat");
  const [draft, setDraft] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const queryReady = isMessageSearchQueryReady(submittedQuery);

  const { data = [], isFetching } = useQuery({
    queryKey: ["channel-search", channel.id, submittedQuery],
    enabled: visible && queryReady,
    queryFn: () =>
      app.rest.get<APIMessage[]>(
        `channels/${channel.id}/messages/search?q=${encodeURIComponent(submittedQuery)}`,
      ),
  });

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!isMessageSearchQueryReady(trimmed)) return;
    setSubmittedQuery(trimmed);
  };

  const handleClose = () => {
    setDraft("");
    setSubmittedQuery("");
    onClose();
  };

  const handleFilterChange = (value: string) => {
    setDraft(value);
    const trimmed = value.trim();
    if (isMessageSearchQueryReady(trimmed)) {
      setSubmittedQuery(trimmed);
    }
  };

  const showResults = submittedQuery.length > 0 && queryReady;

  return (
    <Sheet open={visible} onClose={handleClose}>
      <Box style={{ padding: 16, gap: 12, maxHeight: 420 }}>
        <Typography level="title-sm" weight="bold">
          {t("header.search")}
        </Typography>
        <InputDefault
          placeholder={t("search.hintConversationFilters")}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          fullWidth
        />
        <MessageSearchFilterChips
          query={draft}
          onQueryChange={showResults ? handleFilterChange : setDraft}
          channel={channel}
        />
        {!showResults ? (
          <Button size="sm" onPress={handleSubmit}>
            {t("search.submit")}
          </Button>
        ) : null}
        {!showResults ? (
          <Typography textColor="muted" level="body-sm">
            {t("search.hintConversationFilters")}
          </Typography>
        ) : isFetching ? (
          <Typography textColor="muted" level="body-sm">
            {t("search.searching")}
          </Typography>
        ) : data.length === 0 ? (
          <Typography textColor="muted" level="body-sm">
            {t("search.empty")}
          </Typography>
        ) : (
          <Box style={{ gap: 10 }}>
            {data.map((message) => (
              <Pressable
                key={message.id}
                onPress={() => {
                  app.requestJumpToMessage(channel.id, message.id);
                  handleClose();
                }}
                style={{
                  gap: 6,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: `${theme.colors.neutral}33`,
                }}
              >
                <Typography level="body-md" weight={600}>
                  {message.author?.globalName ?? message.author?.username}
                </Typography>
                {message.content ? (
                  <Box style={{ maxHeight: 96, overflow: "hidden" }}>
                    <MarkdownRenderer
                      variant="plain"
                      textColor="primary"
                      spaceId={message.spaceId ?? channel.spaceId}
                      value={message.content}
                    />
                  </Box>
                ) : (
                  <Typography level="body-md" textColor="muted">
                    {t("search.noText")}
                  </Typography>
                )}
              </Pressable>
            ))}
          </Box>
        )}
      </Box>
    </Sheet>
  );
});
