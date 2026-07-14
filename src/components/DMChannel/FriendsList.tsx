import { ListSection } from "@components/ListSection";
import { Button } from "@components/Button";
import { UserProfileTrigger } from "@components/Profile/UserProfileTrigger";
import { UserAvatar } from "@components/User/UserAvatar";
import { Paper } from "@components/Paper";
import { useUserRowStyle } from "@components/userRowStyle";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Relationship } from "@stores/objects/Relationship";
import { observer } from "mobx-react-lite";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

const RelationshipRow = ({
  relationship,
  actions,
}: {
  relationship: Relationship;
  actions: ReactNode;
}) => {
  const user = relationship.otherUser;
  const rowStyle = useUserRowStyle();
  if (!user) return null;

  return (
    <Paper variant="plain" style={rowStyle}>
      <UserProfileTrigger user={user}>
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 0,
          }}
        >
          <UserAvatar user={user} size="md" />
          <Typography level="body-sm" style={{ flex: 1 }} truncate="single">
            {user.displayName}
          </Typography>
        </Box>
      </UserProfileTrigger>
      <Box style={{ flexDirection: "row", gap: 6, flexShrink: 0 }}>
        {actions}
      </Box>
    </Paper>
  );
};

export const FriendsList = observer(() => {
  const { t } = useTranslation("common");
  const { t: tChat } = useTranslation("chat");
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const incoming = app.relationships.getIncoming();
  const outgoing = app.relationships.getOutgoing();
  const friends = app.relationships.friends;

  useEffect(() => {
    void app.relationships.resolveAll();
  }, [app.relationships]);

  const hasContent =
    incoming.length > 0 || outgoing.length > 0 || friends.length > 0;

  if (!hasContent) {
    return (
      <Typography
        level="body-sm"
        textColor="muted"
        style={{ textAlign: "center", paddingVertical: 24 }}
      >
        {tChat("friends.emptyYet")}
      </Typography>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <ListSection
        name={tChat("friends.incomingCount", { value: incoming.length })}
        items={incoming.map((relationship) => (
          <RelationshipRow
            key={relationship.id}
            relationship={relationship}
            actions={
              <>
                <Button
                  size="sm"
                  color="success"
                  onPress={() =>
                    void app.relationships.acceptFriendRequest(
                      relationship.otherUserIdForMe!,
                    )
                  }
                >
                  {t("accept")}
                </Button>
                <Button
                  size="sm"
                  variant="soft"
                  onPress={() =>
                    void app.relationships.declineFriendRequest(
                      relationship.otherUserIdForMe!,
                    )
                  }
                >
                  {t("decline")}
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="soft"
                  onPress={() =>
                    void app.relationships.blockUser(
                      relationship.otherUserIdForMe!,
                    )
                  }
                >
                  {tChat("contextMenu.block")}
                </Button>
              </>
            }
          />
        ))}
      />

      <ListSection
        name={tChat("friends.pendingSectionCount", {
          value: outgoing.length,
        })}
        items={outgoing.map((relationship) => (
          <RelationshipRow
            key={relationship.id}
            relationship={relationship}
            actions={
              <Button
                size="sm"
                variant="soft"
                onPress={() =>
                  void app.relationships.removeFriend(
                    relationship.otherUserIdForMe!,
                  )
                }
              >
                {t("cancel")}
              </Button>
            }
          />
        ))}
      />

      <ListSection
        name={tChat("friends.friendsSectionCount", {
          value: friends.length,
        })}
        items={friends.map((relationship) => (
          <RelationshipRow
            key={relationship.id}
            relationship={relationship}
            actions={
              <>
                <Button
                  size="sm"
                  variant="soft"
                  onPress={async () => {
                    const user = relationship.otherUser;
                    if (!user) return;
                    const channel = await app.relationships.openDMWith(user.id);
                    navigate(`/@me/${channel.id}`);
                    app.setDMDrawerOpen(false);
                  }}
                >
                  {tChat("friends.message")}
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="soft"
                  onPress={() => {
                    const user = relationship.otherUser;
                    if (!user) return;
                    void app.relationships.removeFriend(user.id);
                  }}
                >
                  {tChat("friends.remove")}
                </Button>
              </>
            }
          />
        ))}
      />
    </ScrollView>
  );
});
