import { DMChannelList } from "@components/DMChannel/DMChannelList";
import { FriendsList } from "@components/DMChannel/FriendsList";
import { Paper } from "@components/Paper";
import { Screen } from "@components/Screen/Screen";
import { useAppStore } from "@hooks/useStores";
import { Box, Button, Typography } from "@mutualzz/ui-native";
import { useRouter, useFocusEffect } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useState } from "react";

type Tab = "direct-messages" | "friends";

const MeIndex = () => {
  const app = useAppStore();
  const [tab, setTab] = useState<Tab>("direct-messages");

  useFocusEffect(
    useCallback(() => {
      app.spaces.setActive("@me");
    }, [app.spaces]),
  );

  if (!app.isReady) {
    return (
      <Screen>
        <Typography style={{ textAlign: "center", padding: 24 }}>
          Loading...
        </Typography>
      </Screen>
    );
  }

  return (
    <Screen
      style={{
        flexDirection: "column",
        borderTopLeftRadius: 8,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
      }}
    >
      <Paper
        style={{
          marginHorizontal: 12,
          marginVertical: 8,
          padding: 8,
          borderRadius: 12,
          flexDirection: "row",
          justifyContent: "space-evenly",
        }}
        elevation={app.settings?.preferEmbossed ? 3 : 0}
      >
        <Button
          variant={tab === "direct-messages" ? "soft" : "plain"}
          onPress={() => setTab("direct-messages")}
        >
          Direct Messages
        </Button>
        <Button
          variant={tab === "friends" ? "soft" : "plain"}
          onPress={() => setTab("friends")}
        >
          Friends
        </Button>
      </Paper>

      {tab === "direct-messages" ? (
        <DMChannelList />
      ) : (
        <Box style={{ flex: 1, paddingHorizontal: 12 }}>
          <FriendsList />
        </Box>
      )}
    </Screen>
  );
};

export default observer(MeIndex);
