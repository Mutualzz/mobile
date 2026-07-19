import { DMChannelItem } from "@components/DMChannel/DMChannelItem";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { FlashList } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { PlusIcon } from "phosphor-react-native";
import { DMChannelCreateSheet } from "./DMChannelCreateSheet";
import { IconButton } from "@components/IconButton";

export const DMChannelList = observer(() => {
  const { t } = useTranslation("chat");
  const app = useAppStore();
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const dms = app.channels.dms;

  const callEpoch = Array.from(app.calls.callsByChannel.values())
    .map(
      (call) =>
        `${call.channelId}:${call.status}:${call.ringing.join(",")}:${call.accepted.join(",")}`,
    )
    .join("|");

  const renderItem = useCallback(
    ({ item }: { item: Channel }) => <DMChannelItem channel={item} />,
    [],
  );

  const keyExtractor = useCallback((channel: Channel) => channel.id, []);

  return (
    <>
      <Paper
        style={{
          flex: 1,
          padding: 12,
          marginHorizontal: 12,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Box
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 4,
            paddingVertical: 2,
            marginBottom: 8,
          }}
        >
          <Typography
            level="label-xs"
            textColor="muted"
            style={{ marginBottom: 8 }}
          >
            {t("dm.title")}
          </Typography>
          <IconButton
            accessibilityLabel={t("dm.createGroupA11y")}
            onPress={() => setCreateGroupOpen(true)}
            variant="plain"
            padding={0}
            size="sm"
            hitSlop={10}
          >
            <PlusIcon weight="bold" />
          </IconButton>
        </Box>

        {dms.length === 0 ? (
          <Typography
            level="body-sm"
            textColor="muted"
            style={{ textAlign: "center", paddingVertical: 24 }}
          >
            {t("dm.empty")}
          </Typography>
        ) : (
          <View style={{ flex: 1, minHeight: 0 }}>
            <FlashList
              data={dms}
              extraData={`${callEpoch}|${dms
                .map(
                  (channel) => `${channel.id}:${channel.lastMessageId ?? ""}`,
                )
                .join("|")}`}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              drawDistance={250}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          </View>
        )}
      </Paper>
      <DMChannelCreateSheet
        visible={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
      />
    </>
  );
});
