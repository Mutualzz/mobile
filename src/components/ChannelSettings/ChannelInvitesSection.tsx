import { Button } from "@components/Button";
import { InviteRow } from "@components/SpaceSettings/SpaceInvitesSettings";
import { SpaceCreateInviteSheet } from "@components/SpaceSettings/SpaceCreateInviteSheet";
import { useModal } from "@hooks/useModal";
import { Box, Divider, Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { Space } from "@stores/objects/Space";
import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  space: Space;
  channel: Channel;
}

export const ChannelInvitesSection = observer(({ space, channel }: Props) => {
  const { t } = useTranslation("space");
  const { openModal } = useModal();
  const [now, setNow] = useState(new Date());

  useQuery({
    queryKey: ["space-invites", space.id],
    queryFn: () => space.fetchInvites(),
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const invites = space.inviteList.filter(
    (invite) => String(invite.channelId) === String(channel.id),
  );
  const canCreateInvites =
    space.members.me?.hasPermission("CreateInvites", channel) ?? false;

  if (!canCreateInvites) return null;

  return (
    <Box style={{ gap: 12, paddingTop: 8 }}>
      <Divider lineColor="muted" />
      <Box
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography level="body-md" weight="bold">
          {t("channels.channelInvites")}
        </Typography>
        <Button
          size="sm"
          onPress={() =>
            openModal(
              `channel-create-invite-${channel.id}`,
              <SpaceCreateInviteSheet space={space} channel={channel} />,
            )
          }
        >
          {t("channels.createInvite")}
        </Button>
      </Box>

      {invites.length === 0 ? (
        <Typography level="body-sm" textColor="muted">
          {t("channels.noChannelInvites", { channel: channel.name })}
        </Typography>
      ) : (
        <Box style={{ gap: 8 }}>
          {invites.map((invite) => (
            <InviteRow key={invite.code} invite={invite} now={now} space={space} />
          ))}
        </Box>
      )}
    </Box>
  );
});
