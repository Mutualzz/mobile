import { DMChannelItem } from "@components/DMChannel/DMChannelItem";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { FlashList } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const ESTIMATED_DM_ROW_HEIGHT = 64;

export const DMChannelList = observer(() => {
  const { t } = useTranslation("chat");
  const app = useAppStore();
  const dms = app.channels.dms;

  const renderItem = useCallback(
    ({ item }: { item: Channel }) => <DMChannelItem channel={item} />,
    [],
  );

  return (
    <Paper
      style={{
        flex: 1,
        padding: 12,
        marginHorizontal: 12,
      }}
      elevation={app.settings?.preferEmbossed ? 2 : 0}
    >
      <Typography level="label-xs" textColor="muted" style={{ marginBottom: 8 }}>
        {t("dm.title")}
      </Typography>

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
            keyExtractor={(channel) => channel.id}
            renderItem={renderItem}
            drawDistance={250}
            overrideItemLayout={(layout: { span?: number; size?: number }) => {
              layout.size = ESTIMATED_DM_ROW_HEIGHT;
            }}
          />
        </View>
      )}
    </Paper>
  );
});
