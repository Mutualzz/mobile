import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import type { APICodedLink } from "@mutualzz/types";
import { InviteType } from "@mutualzz/types";
import { Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  link: APICodedLink;
}

const FriendCodedLinkPreview = observer(({ link }: { link: APICodedLink }) => {
  const { t } = useTranslation("auth");
  const { t: tChat } = useTranslation("chat");
  const app = useAppStore();
  const router = useRouter();

  const user = link.user ?? link.inviter;
  const userId = user?.id;
  const displayName = user?.globalName ?? user?.username ?? tChat("someone");
  const isSelf = userId === app.account?.id;
  const relationship = userId ? app.relationships.getForMe(userId) : undefined;

  const { mutate: addFriend, isPending } = useMutation({
    mutationFn: () => app.relationships.acceptFriendInvite(link.code),
    onSuccess: (result) => {
      app.relationships.update(result);
    },
  });

  const actionLabel = relationship?.isFriend
    ? t("invite.friends")
    : relationship?.isOutgoingRequest
      ? t("invite.pending")
      : t("invite.addFriend");

  const actionDisabled =
    isPending ||
    isSelf ||
    relationship?.isFriend ||
    relationship?.isOutgoingRequest;

  return (
    <Paper style={styles.friendCard}>
      <Pressable
        onPress={() => router.push(`/invite/${link.code}`)}
        style={styles.friendMain}
      >
        <UserAvatar user={user} size={40} />
        <View style={styles.headerText}>
          <Typography weight="bold" numberOfLines={1}>
            {displayName}
          </Typography>
          {user?.username && (
            <Typography level="body-xs" textColor="secondary">
              @{user.username}
            </Typography>
          )}
        </View>
      </Pressable>
      <Button
        size="sm"
        variant={relationship?.isFriend ? "soft" : "solid"}
        disabled={actionDisabled}
        onPress={() => {
          if (actionDisabled) return;
          addFriend();
        }}
      >
        {isSelf ? tChat("you") : actionLabel}
      </Button>
    </Paper>
  );
});

export const CodedLinkPreview = observer(({ link }: Props) => {
  const { t } = useTranslation("auth");
  const { t: tChat } = useTranslation("chat");
  const { t: tSpace } = useTranslation("space");
  const router = useRouter();

  if (link.type === InviteType.Friend) {
    return <FriendCodedLinkPreview link={link} />;
  }

  const openInvite = () => router.push(`/invite/${link.code}`);

  const inviterName =
    link.inviter?.globalName ?? link.inviter?.username ?? tChat("someone");
  const memberCount = link.approximateMemberCount;
  const onlineCount = link.approximatePresenceCount;

  return (
    <Pressable onPress={openInvite} style={styles.pressable}>
      <Paper style={styles.card}>
        <View style={styles.header}>
          <SpaceIcon space={link.space} size={48} />
          <View style={styles.headerText}>
            <Typography weight="bold" numberOfLines={1}>
              {link.space?.name ?? tChat("unknownSpace")}
            </Typography>
            {(memberCount != null && memberCount > 0) ||
              (onlineCount != null && onlineCount > 0 && (
                <Typography level="body-xs" textColor="secondary">
                  {onlineCount != null && onlineCount > 0
                    ? `${onlineCount.toLocaleString()} ${tChat("online")}`
                    : ""}
                  {onlineCount != null &&
                  onlineCount > 0 &&
                  memberCount != null &&
                  memberCount > 0
                    ? " • "
                    : ""}
                  {memberCount != null && memberCount > 0
                    ? tSpace("roles.memberCount", { count: memberCount })
                    : ""}
                </Typography>
              ))}
          </View>
        </View>
        <Typography level="body-xs" textColor="secondary">
          {t("invite.invitedYouToJoin", { name: inviterName })}
          {link.channel?.name ? ` #${link.channel.name}` : ""}
        </Typography>
      </Paper>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressable: {
    maxWidth: 320,
  },

  card: {
    flexDirection: "column",
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },

  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    padding: 10,
    gap: 10,
    maxWidth: 320,
  },

  friendMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
