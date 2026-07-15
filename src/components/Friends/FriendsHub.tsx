import { ListSection } from "@components/ListSection";
import { Button } from "@components/Button";
import { UserProfileTrigger } from "@components/Profile/UserProfileTrigger";
import { UserAvatar } from "@components/User/UserAvatar";
import { Paper } from "@components/Paper";
import { useUserRowStyle } from "@components/userRowStyle";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { presenceStatusKeys } from "@mutualzz/i18n";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Relationship } from "@stores/objects/Relationship";
import { observer } from "mobx-react-lite";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { IconButton } from "@components/IconButton";
import { ChatCircleIcon } from "phosphor-react-native";

export type FriendsTab = "online" | "all" | "pending";

const RelationshipRow = ({
  relationship,
  actions,
  showPresence = false,
}: {
  relationship: Relationship;
  actions?: ReactNode;
  showPresence?: boolean;
}) => {
  const { t } = useTranslation("common");
  const app = useAppStore();
  const user = relationship.otherUser;
  const rowStyle = useUserRowStyle();
  if (!user) return null;

  const presence = showPresence ? app.presence.get(user.id) : null;
  const statusKey =
    presence?.status && presence.status !== "offline"
      ? presenceStatusKeys[presence.status as keyof typeof presenceStatusKeys]
      : null;
  const statusLabel = statusKey ? t(statusKey) : null;

  return (
    <UserProfileTrigger user={user}>
      <Paper variant="plain" style={rowStyle}>
        <UserAvatar user={user} size="md" badge={showPresence} />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Typography level="body-sm" truncate="single">
            {user.displayName}
          </Typography>
          {statusLabel && (
            <Typography level="body-xs" textColor="muted">
              {statusLabel}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box style={{ flexDirection: "row", gap: 6, flexShrink: 0 }}>
            {actions}
          </Box>
        )}
      </Paper>
    </UserProfileTrigger>
  );
};

const MessageActions = ({ relationship }: { relationship: Relationship }) => {
  const app = useAppStore();
  const { navigate } = useAppNavigation();

  return (
    <>
      <IconButton
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
        <ChatCircleIcon weight="fill" />
      </IconButton>
    </>
  );
};

interface Props {
  tab: FriendsTab;
}

export const FriendsHub = observer(({ tab }: Props) => {
  const app = useAppStore();
  const { t } = useTranslation("chat");

  useEffect(() => {
    void app.relationships.resolveAll();
  }, [app.relationships]);

  const online = app.relationships.online;
  const friends = app.relationships.friends;
  const incoming = app.relationships.getIncoming();
  const outgoing = app.relationships.getOutgoing();

  if (tab === "online") {
    if (online.length === 0) {
      return (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center", paddingVertical: 24 }}
        >
          {t("friends.emptyOnline")}
        </Typography>
      );
    }

    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <ListSection
          name={t("friends.onlineCount", { count: online.length })}
          items={online.map((relationship) => (
            <RelationshipRow
              key={relationship.id}
              relationship={relationship}
              showPresence
              actions={<MessageActions relationship={relationship} />}
            />
          ))}
        />
      </ScrollView>
    );
  }

  if (tab === "all") {
    if (friends.length === 0) {
      return (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center", paddingVertical: 24 }}
        >
          {t("friends.emptyAll")}
        </Typography>
      );
    }

    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <ListSection
          name={t("friends.allCount", { count: friends.length })}
          items={friends.map((relationship) => (
            <RelationshipRow
              key={relationship.id}
              relationship={relationship}
              actions={<MessageActions relationship={relationship} />}
            />
          ))}
        />
      </ScrollView>
    );
  }

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <Typography
        level="body-sm"
        textColor="muted"
        style={{ textAlign: "center", paddingVertical: 24 }}
      >
        {t("friends.emptyPending")}
      </Typography>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <ListSection
        name={t("friends.receivedCount", { count: incoming.length })}
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
                  {t("contextMenu.acceptFriendRequest")}
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
                  {t("contextMenu.declineFriendRequest")}
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
                  {t("contextMenu.block")}
                </Button>
              </>
            }
          />
        ))}
      />

      <ListSection
        name={t("friends.sentCount", { count: outgoing.length })}
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
                {t("contextMenu.cancelFriendRequest")}
              </Button>
            }
          />
        ))}
      />
    </ScrollView>
  );
});
