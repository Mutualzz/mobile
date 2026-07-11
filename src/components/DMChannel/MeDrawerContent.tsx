import { DMChannelCreateSheet } from "@components/DMChannel/DMChannelCreateSheet";
import { Button } from "@components/Button";
import { DMChannelList } from "@components/DMChannel/DMChannelList";
import { FriendsHub, type FriendsTab } from "@components/Friends/FriendsHub";
import { AddFriendTab } from "@components/Friends/AddFriendTab";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { Screen } from "@components/Screen/Screen";
import { useKeyboardChromeInset } from "@hooks/useKeyboardChromeInset";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import { PlusIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Tab = "direct-messages" | "friends";
type FriendsSubTab = FriendsTab | "add-friend";

export const MeDrawerContent = observer(() => {
  const app = useAppStore();
  const { t } = useTranslation("chat");
  const { t: tSpace } = useTranslation("space");
  const tabBarInset = useKeyboardChromeInset();
  const [tab, setTab] = useState<Tab>("direct-messages");
  const [friendsSubTab, setFriendsSubTab] = useState<FriendsSubTab>("online");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  if (!app.isReady) {
    return (
      <Screen>
        <Typography style={{ textAlign: "center", padding: 24 }}>
          {t("loading")}
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
          {tSpace("sidebar.directMessages")}
        </Button>
        <Button
          variant={tab === "friends" ? "soft" : "plain"}
          onPress={() => setTab("friends")}
        >
          {t("friends.title")}
        </Button>
        {tab === "direct-messages" && (
          <IconButton
            accessibilityLabel={t("dm.createGroupA11y")}
            onPress={() => setCreateGroupOpen(true)}
          >
            <PlusIcon weight="bold" />
          </IconButton>
        )}
      </Paper>

      {tab === "direct-messages" ? (
        <DMChannelList />
      ) : (
        <Box style={{ flex: 1, paddingHorizontal: 12, gap: 12 }}>
          <Paper
            style={{
              padding: 6,
              borderRadius: 12,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
            }}
            elevation={app.settings?.preferEmbossed ? 2 : 0}
          >
            <Button
              expand
              size="sm"
              variant={friendsSubTab === "online" ? "soft" : "plain"}
              onPress={() => setFriendsSubTab("online")}
            >
              {t("friends.tabs.online")}
            </Button>
            <Button
              expand
              size="sm"
              variant={friendsSubTab === "all" ? "soft" : "plain"}
              onPress={() => setFriendsSubTab("all")}
            >
              {t("friends.tabs.all")}
            </Button>
            <Button
              expand
              size="sm"
              variant={friendsSubTab === "pending" ? "soft" : "plain"}
              onPress={() => setFriendsSubTab("pending")}
            >
              {t("friends.tabs.pending")}
            </Button>
            <Button
              expand
              size="sm"
              color="primary"
              variant={friendsSubTab === "add-friend" ? "soft" : "plain"}
              onPress={() => setFriendsSubTab("add-friend")}
            >
              {t("friends.tabs.addFriend")}
            </Button>
          </Paper>
          {friendsSubTab === "add-friend" ? (
            <AddFriendTab />
          ) : (
            <FriendsHub tab={friendsSubTab} />
          )}
        </Box>
      )}

      <DMChannelCreateSheet
        visible={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
      />
    </Screen>
  );
});
