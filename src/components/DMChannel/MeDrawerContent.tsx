import { BridgeChannelList } from "@components/Bridge/BridgeChannelList";
import { BrandLoader } from "@components/BrandLoader";
import { Button } from "@components/Button";
import { DMChannelList } from "@components/DMChannel/DMChannelList";
import { FriendsHub, type FriendsTab } from "@components/Friends/FriendsHub";
import { AddFriendTab } from "@components/Friends/AddFriendTab";
import { Paper } from "@components/Paper";
import { Screen } from "@components/Screen/Screen";
import { useKeyboardChromeInset } from "@hooks/useKeyboardChromeInset";
import { useAppStore } from "@hooks/useStores";
import { Box, useTheme } from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { CubeIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type Tab = "direct-messages" | "friends" | "bridges";
type FriendsSubTab = FriendsTab | "add-friend";

export const MeDrawerContent = observer(() => {
  const app = useAppStore();
  const { t } = useTranslation("chat");
  const { t: tSpace } = useTranslation("space");
  const { t: tSettings } = useTranslation("settings");
  const { theme } = useTheme();
  const tabBarInset = useKeyboardChromeInset();
  const unreadDotSize = useScaledSquareSize(8);
  const [tab, setTab] = useState<Tab>("direct-messages");
  const [friendsSubTab, setFriendsSubTab] = useState<FriendsSubTab>("online");

  const bridgesUnread = app.bridgeChat.hasAnyUnread;

  if (!app.isReady) {
    return (
      <Screen>
        <Box
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <BrandLoader size={72} />
        </Box>
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
      <Box style={{ flex: 1, paddingBottom: tabBarInset }}>
        <Paper
          style={{
            marginHorizontal: 12,
            marginVertical: 8,
            padding: 8,
            borderRadius: 12,
            flexDirection: "row",
            justifyContent: "space-evenly",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 4,
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
          <Button
            variant={tab === "bridges" ? "soft" : "plain"}
            onPress={() => setTab("bridges")}
            startDecorator={<CubeIcon weight="fill" size={16} />}
            endDecorator={
              bridgesUnread && tab !== "bridges" ? (
                <View
                  style={{
                    width: unreadDotSize,
                    height: unreadDotSize,
                    borderRadius: 9999,
                    backgroundColor: theme.typography.colors.primary,
                  }}
                />
              ) : undefined
            }
          >
            {tSettings("minecraftBridge.sidebarTitle")}
          </Button>
        </Paper>

        {tab === "direct-messages" ? (
          <DMChannelList />
        ) : tab === "bridges" ? (
          <BridgeChannelList />
        ) : (
          <Box style={{ flex: 1, paddingHorizontal: 12, gap: 12 }}>
            <Paper
              style={{
                padding: 6,
                borderRadius: 12,
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 4,
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
              {app.relationships.pending.length > 0 && (
                <Button
                  expand
                  size="sm"
                  variant={friendsSubTab === "pending" ? "soft" : "plain"}
                  onPress={() => setFriendsSubTab("pending")}
                >
                  {t("friends.tabs.pending")}
                </Button>
              )}

              <Button
                expand
                size="sm"
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
      </Box>
    </Screen>
  );
});
