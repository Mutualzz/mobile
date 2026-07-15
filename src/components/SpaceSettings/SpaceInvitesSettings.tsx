import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { SpaceCreateInviteSheet } from "@components/SpaceSettings/SpaceCreateInviteSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { Box, Divider, Typography } from "@mutualzz/ui-native";
import type { Invite } from "@stores/objects/Invite";
import type { Space } from "@stores/objects/Space";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { observer } from "mobx-react-lite";
import { CopyIcon, TrashIcon } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  space: Space;
}

function pad(num: number) {
  return num.toString().padStart(2, "0");
}

function formatCountdown(expiresAt: Date, now: Date, expiredLabel: string) {
  const diff = expiresAt.getTime() - now.getTime();
  if (diff <= 0) return expiredLabel;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export const InviteRow = observer(
  ({ invite, now, space }: { invite: Invite; now: Date; space: Space }) => {
    const { t } = useTranslation("space");
    const { t: tCommon } = useTranslation("common");
    const app = useAppStore();
    const [copied, setCopied] = useState(false);
    const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
      () => () => {
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
      },
      [],
    );

    const spaceMe = space.members.me;
    const canManageChannels = spaceMe?.hasPermission("ManageChannels") ?? false;
    const isInviter = invite.inviterId === app.account?.id;
    const canDelete = canManageChannels || isInviter;

    const copyInviteLink = async () => {
      await Clipboard.setStringAsync(invite.url);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    };

    return (
      <Paper
        variant="plain"
        style={{
          padding: 12,
          borderRadius: 10,
          gap: 10,
          minWidth: 0,
        }}
      >
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          {invite.inviter && <UserAvatar user={invite.inviter} size="md" />}
          <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Typography level="body-sm" truncate="single">
              {invite.inviter?.displayName ?? t("unknown", { ns: "chat" })}
            </Typography>
            {invite.channel && (
              <Typography level="body-xs" textColor="muted" truncate="single">
                #{invite.channel.name}
              </Typography>
            )}
          </Box>
        </Box>

        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
          }}
        >
          <Typography
            level="body-sm"
            style={{ flex: 1, fontFamily: "monospace" }}
            truncate="single"
          >
            {invite.code}
          </Typography>
          <IconButton
            padding={6}
            size={16}
            color="neutral"
            variant="soft"
            onPress={() => void copyInviteLink()}
            accessibilityLabel={t("invites.copyInviteUrl")}
          >
            <CopyIcon weight="fill" />
          </IconButton>
          {copied && (
            <Typography level="body-xs" textColor="muted">
              {t("invites.copiedToClipboard")}
            </Typography>
          )}
        </Box>

        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Typography level="body-xs" textColor="muted">
            {t("invites.usesLabel", {
              uses: invite.uses,
              max:
                invite.maxUses === 0
                  ? ""
                  : t("invites.usesMax", { max: invite.maxUses }),
            })}
          </Typography>
          <Typography level="body-xs" textColor="muted">
            {invite.expiresAt
              ? formatCountdown(invite.expiresAt, now, t("invites.expired"))
              : t("invites.neverExpires")}
          </Typography>
          {canDelete && (
            <IconButton
              padding={6}
              size={16}
              color="danger"
              variant="soft"
              onPress={() => void invite.delete()}
              accessibilityLabel={tCommon("a11y.deleteInvite")}
            >
              <TrashIcon weight="fill" />
            </IconButton>
          )}
        </Box>
      </Paper>
    );
  },
);

export const SpaceInvitesSettings = observer(({ space }: Props) => {
  const { t } = useTranslation("space");
  const { openSheet } = useSheet();
  const [now, setNow] = useState(new Date());

  useQuery({
    queryKey: ["space-invites", space.id],
    queryFn: () => space.fetchInvites(),
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const invites = space.inviteList;
  const canManageChannels =
    space.members.me?.hasPermission("ManageChannels") ?? false;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 32,
        gap: 16,
      }}
    >
      <Box
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography level="body-md" weight={700}>
          {t("invites.activeLinks")}
        </Typography>
        <Box style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {canManageChannels && (
            <Button
              size="sm"
              color="danger"
              variant="soft"
              disabled={invites.length === 0}
              onPress={() => void space.deleteAll()}
            >
              {t("actions.deleteAllInvites")}
            </Button>
          )}
          <Button
            size="sm"
            onPress={() =>
              openSheet(
                "space-create-invite",
                <SpaceCreateInviteSheet space={space} />,
              )
            }
          >
            {t("actions.createInvite")}
          </Button>
        </Box>
      </Box>

      {invites.length === 0 ? (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ textAlign: "center", paddingVertical: 32 }}
        >
          {t("invites.empty")}
        </Typography>
      ) : (
        <Box style={{ gap: 8 }}>
          {invites.map((invite, index) => (
            <Box key={invite.code} style={{ gap: 8 }}>
              <InviteRow invite={invite} now={now} space={space} />
              {index < invites.length - 1 && (
                <Divider lineColor="muted" style={{ opacity: 0.25 }} />
              )}
            </Box>
          ))}
        </Box>
      )}
    </ScrollView>
  );
});
