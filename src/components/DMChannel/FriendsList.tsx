import { ListSection } from "@components/ListSection";
import { Button } from "@components/Button";
import { UserProfileTrigger } from "@components/Profile/UserProfileTrigger";
import { UserAvatar } from "@components/User/UserAvatar";
import { Paper } from "@components/Paper";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Relationship } from "@stores/objects/Relationship";
import { observer } from "mobx-react-lite";
import { useEffect, type ReactNode } from "react";
import { ScrollView } from "react-native";

const RelationshipRow = ({
  relationship,
  actions,
}: {
  relationship: Relationship;
  actions: ReactNode;
}) => {
  const user = relationship.otherUser;
  if (!user) return null;

  return (
    <UserProfileTrigger user={user}>
      <Paper
        variant="plain"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 10,
        }}
      >
        <UserAvatar user={user} size="md" />
        <Typography level="body-sm" style={{ flex: 1 }} numberOfLines={1}>
          {user.displayName}
        </Typography>
        <Box style={{ flexDirection: "row", gap: 6, flexShrink: 0 }}>
          {actions}
        </Box>
      </Paper>
    </UserProfileTrigger>
  );
};

export const FriendsList = observer(() => {
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
        No friends yet.
      </Typography>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <ListSection
        name={`Incoming — ${incoming.length}`}
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
                  Accept
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
                  Decline
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
                  Block
                </Button>
              </>
            }
          />
        ))}
      />

      <ListSection
        name={`Pending — ${outgoing.length}`}
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
                Cancel
              </Button>
            }
          />
        ))}
      />

      <ListSection
        name={`Friends — ${friends.length}`}
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
                  Message
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
                  Remove
                </Button>
              </>
            }
          />
        ))}
      />
    </ScrollView>
  );
});
