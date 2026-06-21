import { DMChannelCreateSheet } from "@components/DMChannel/DMChannelCreateSheet";
import { DMChannelList } from "@components/DMChannel/DMChannelList";
import { FriendsList } from "@components/DMChannel/FriendsList";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { Screen } from "@components/Screen/Screen";
import { useTabBarContentInset } from "@hooks/useTabBarContentInset";
import { useAppStore } from "@hooks/useStores";
import { Box, Button, Typography } from "@mutualzz/ui-native";
import { PlusIcon } from "phosphor-react-native";
import { useFocusEffect } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";

type Tab = "direct-messages" | "friends";

const MeIndex = () => {
  const app = useAppStore();
  const tabBarInset = useTabBarContentInset();
  const [tab, setTab] = useState<Tab>("direct-messages");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

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
        paddingBottom: tabBarInset,
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
          alignItems: "center",
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
        {tab === "direct-messages" && (
          <IconButton
            accessibilityLabel="Create group DM"
            onPress={() => setCreateGroupOpen(true)}
          >
            <PlusIcon weight="bold" />
          </IconButton>
        )}
      </Paper>

      {tab === "direct-messages" ? (
        <DMChannelList />
      ) : (
        <Box style={{ flex: 1, paddingHorizontal: 12 }}>
          <FriendsList />
        </Box>
      )}

      <DMChannelCreateSheet
        visible={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
      />
    </Screen>
  );
};

export default observer(MeIndex);
