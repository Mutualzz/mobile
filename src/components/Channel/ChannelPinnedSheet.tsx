import { useAppStore } from "@hooks/useStores";
import type { APIMessage } from "@mutualzz/types";
import { Box, Sheet, Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PushPinIcon } from "phosphor-react-native";
import { ScrollView } from "react-native";
import { PinnedMessageCard } from "./PinnedMessageCard";

interface Props {
  channel: Channel;
  visible: boolean;
  onClose: () => void;
}

export const ChannelPinnedSheet = observer(({ channel, visible, onClose }: Props) => {
  const app = useAppStore();
  const { t } = useTranslation("chat");

  const { data = [] } = useQuery({
    queryKey: ["channel-pins", channel.id],
    enabled: visible,
    queryFn: () =>
      app.rest.get<APIMessage[]>(`channels/${channel.id}/messages/pins`),
  });

  const pins = useMemo(() => [...data].reverse(), [data]);

  return (
    <Sheet open={visible} onClose={onClose}>
      <Box style={{ maxHeight: "80%", gap: 0 }}>
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.06)",
          }}
        >
          <PushPinIcon size={18} weight="fill" />
          <Typography level="title-sm" weight="bold">
            {t("header.pins")}
          </Typography>
        </Box>

        {pins.length === 0 ? (
          <Box style={{ alignItems: "center", paddingVertical: 32, gap: 8 }}>
            <PushPinIcon size={28} weight="fill" />
            <Typography textColor="muted" level="body-sm" style={{ textAlign: "center" }}>
              {t("pins.empty")}
            </Typography>
          </Box>
        ) : (
          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingBottom: 16 }}>
            {pins.map((message) => (
              <PinnedMessageCard
                key={message.id}
                message={message}
                space={channel.space}
                onJump={() => {
                  app.requestJumpToMessage(channel.id, message.id);
                  onClose();
                }}
              />
            ))}
          </ScrollView>
        )}
      </Box>
    </Sheet>
  );
});
