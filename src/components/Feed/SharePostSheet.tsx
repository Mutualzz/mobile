import { Button } from "@components/Button";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, Sheet, Typography } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import type { Channel } from "@stores/objects/Channel";
import type { User } from "@stores/objects/User";
import Snowflake from "@utils/Snowflake";
import { CheckIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

interface Props {
  visible: boolean;
  post: Post;
  onClose: () => void;
}

function ShareRow({
  avatar,
  name,
  sent,
  sending,
  onSend,
  sendLabel,
  sendingLabel,
}: {
  avatar: React.ReactNode;
  name: React.ReactNode;
  sent: boolean;
  sending: boolean;
  onSend: () => void;
  sendLabel: string;
  sendingLabel: string;
}) {
  return (
    <Box
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Box style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
        {avatar}
        <Typography level="body-sm" style={{ flex: 1 }} truncate="single">
          {name}
        </Typography>
      </Box>
      <Button
        size="sm"
        variant={sent ? "soft" : "solid"}
        disabled={sent || sending}
        onPress={onSend}
      >
        {sent ? <CheckIcon size={16} /> : sending ? sendingLabel : sendLabel}
      </Button>
    </Box>
  );
}

export const SharePostSheet = observer(({ visible, post, onClose }: Props) => {
  const { t } = useTranslation("chat");
  const app = useAppStore();
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [sendingTo, setSendingTo] = useState<Set<string>>(new Set());
  const sendingKeysRef = useRef<Set<string>>(new Set());

  const runSend = async (key: string, action: () => Promise<void>) => {
    if (sentTo.has(key) || sendingKeysRef.current.has(key)) return;

    sendingKeysRef.current.add(key);
    setSendingTo(new Set(sendingKeysRef.current));

    try {
      await action();
      setSentTo((prev) => new Set(prev).add(key));
      if (!post.shared) void post.toggleShare();
    } finally {
      sendingKeysRef.current.delete(key);
      setSendingTo(new Set(sendingKeysRef.current));
    }
  };

  const sendToChannel = (channel: Channel, key: string) =>
    runSend(key, async () => {
      await channel.sendMessage({
        content: "",
        nonce: Snowflake.generate(),
        sharedPostId: post.id,
      });
    });

  const sendToFriend = (friend: User) => {
    const key = `friend:${friend.id}`;

    return runSend(key, async () => {
      const channel = await app.channels.openDM(friend.id);
      await channel.sendMessage({
        content: "",
        nonce: Snowflake.generate(),
        sharedPostId: post.id,
      });
    });
  };

  const dmUserIds = new Set(
    app.channels.dms
      .filter((channel) => channel.type === ChannelType.DM)
      .map((channel) => channel.dmRecipient?.id)
      .filter((id): id is string => !!id),
  );

  const friendsWithoutDM = app.relationships.all
    .filter((relationship) => relationship.isFriend)
    .map((relationship) => relationship.otherUser)
    .filter((user): user is User => !!user)
    .filter((user) => !dmUserIds.has(user.id));

  const hasNothingToShow =
    app.channels.dms.length === 0 && friendsWithoutDM.length === 0;

  return (
    <Sheet
      open={visible}
      onClose={onClose}
      showCloseButton={false}
      enableDynamicSizing
    >
      <View style={{ width: "100%", padding: 16, gap: 12 }}>
          <Typography level="body-lg" weight={700}>
            {t("feed.share.title")}
          </Typography>

          <ScrollView contentContainerStyle={{ gap: 12 }}>
            {hasNothingToShow && (
              <Typography level="body-sm" textColor="muted">
                {t("feed.empty.shareTargets")}
              </Typography>
            )}

            {app.channels.dms.map((channel) => {
              const isGroupDM = channel.type === ChannelType.GroupDM;

              return (
                <ShareRow
                  key={channel.id}
                  avatar={
                    isGroupDM ? (
                      <UserAvatar user={channel.dmRecipientsList[0]} size="sm" />
                    ) : (
                      <UserAvatar user={channel.dmRecipient} size="sm" />
                    )
                  }
                  name={
                    isGroupDM
                      ? (channel.name ??
                        channel.dmRecipientsList
                          .map((r) => r.displayName)
                          .join(", "))
                      : channel.dmRecipient?.displayName
                  }
                  sent={sentTo.has(channel.id)}
                  sending={sendingTo.has(channel.id)}
                  sendLabel={t("feed.share.send")}
                  sendingLabel={t("feed.share.sending")}
                  onSend={() => {
                    void sendToChannel(channel, channel.id);
                  }}
                />
              );
            })}

            {friendsWithoutDM.map((friend) => (
              <ShareRow
                key={friend.id}
                avatar={<UserAvatar user={friend} size="sm" />}
                name={friend.displayName}
                sent={sentTo.has(`friend:${friend.id}`)}
                sending={sendingTo.has(`friend:${friend.id}`)}
                sendLabel={t("feed.share.send")}
                sendingLabel={t("feed.share.sending")}
                onSend={() => {
                  void sendToFriend(friend);
                }}
              />
            ))}
          </ScrollView>

          <Button variant="soft" onPress={onClose}>
            {t("feed.share.done")}
          </Button>
      </View>
    </Sheet>
  );
});
