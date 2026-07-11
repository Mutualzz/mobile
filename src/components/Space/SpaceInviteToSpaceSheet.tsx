import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import {
  ChannelType,
  type APIInvite,
  type HttpException,
} from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import { Invite } from "@stores/objects/Invite";
import type { Space } from "@stores/objects/Space";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import * as Clipboard from "expo-clipboard";
import { CopyIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  space: Space;
  channel?: Channel | null;
  onClose?: () => void;
}

type CreateInviteResponse = APIInvite & { editSessionId?: string };

export const SpaceInviteToSpaceSheet = observer(
  ({ space, channel, onClose }: Props) => {
    const { t } = useTranslation("space");
    const { t: tSettings } = useTranslation("settings");
    const { t: tCommon } = useTranslation("common");
    const app = useAppStore();

    const expirations = [
      { label: t("invites.expiry.30minutes"), value: 1800 },
      { label: t("invites.expiry.1hour"), value: 3600 },
      { label: t("invites.expiry.6hours"), value: 21600 },
      { label: t("invites.expiry.12hours"), value: 43200 },
      { label: t("invites.expiry.1day"), value: 86400 },
      { label: t("invites.expiry.7days"), value: 604800 },
      { label: t("invites.expiry.never"), value: null },
    ] as const;

    const maxUsesOptions = [
      { label: t("invites.maxUses.noLimit"), value: 0 },
      { label: t("invites.maxUses.1use"), value: 1 },
      { label: t("invites.maxUses.5uses"), value: 5 },
      { label: t("invites.maxUses.10uses"), value: 10 },
      { label: t("invites.maxUses.25uses"), value: 25 },
      { label: t("invites.maxUses.50uses"), value: 50 },
      { label: t("invites.maxUses.100uses"), value: 100 },
    ] as const;

    const [editing, setEditing] = useState(false);
    const [expiresAfter, setExpiresAfter] = useState<number | null>(
      expirations[5].value,
    );
    const [maxUsesAfter, setMaxUsesAfter] = useState<number>(
      maxUsesOptions[0].value,
    );
    const [invite, setInvite] = useState<Invite | null>(null);
    const [copied, setCopied] = useState(false);
    const [editSessionId, setEditSessionId] = useState<string | null>(null);
    const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const channelToUse =
      channel ??
      space.firstNavigableChannel ??
      space.visibleChannels.find((item) => item.type === ChannelType.Text);

    const { data, isLoading, error } = useQuery<
      CreateInviteResponse | undefined,
      HttpException
    >({
      queryKey: ["createInvite", space.id, channelToUse?.id],
      queryFn: () => space.createInvite(channelToUse?.id),
      enabled: !!space.id,
      refetchOnWindowFocus: false,
    });

    const { mutate: updateInvite, isPending: saving } = useMutation({
      mutationKey: ["updateInvite", invite?.code],
      mutationFn: () =>
        app.rest.patch<APIInvite>(
          `/spaces/${space.id}/invites/${invite?.code}`,
          {
            maxUses: maxUsesAfter,
            expiresAt: expiresAfter,
          },
          {},
          editSessionId ? { "x-invite-edit-session": editSessionId } : {},
        ),
      onSuccess: (updated) => {
        setEditing(false);
        setInvite(new Invite(app, updated));
        space.addInvite(updated);
        setEditSessionId(null);
      },
    });

    const { mutateAsync: keepAlive } = useMutation({
      mutationKey: ["inviteKeepAlive", invite?.code],
      mutationFn: async () => {
        if (!invite?.code || !editSessionId) return;
        await app.rest.post(
          `/spaces/${space.id}/invites/${invite.code}/keepalive`,
          null,
          {},
          { "x-invite-edit-session": editSessionId },
        );
      },
    });

    useEffect(() => {
      if (!isLoading && data) {
        setInvite(new Invite(app, data));
        space.addInvite(data);
        setEditSessionId(data.editSessionId ?? null);
      }
    }, [app, data, isLoading, space]);

    useEffect(() => {
      if (!editing || !editSessionId || !invite?.code) return;

      const id = setInterval(() => {
        void keepAlive().catch(() => null);
      }, 12000);

      return () => clearInterval(id);
    }, [editing, editSessionId, invite?.code, keepAlive]);

    useEffect(
      () => () => {
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
      },
      [],
    );

    const inviteUrl = Invite.constructUrl(invite?.code || "");

    const copyInviteLink = async () => {
      if (!inviteUrl) return;
      await Clipboard.setStringAsync(inviteUrl);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    };

    if (editing) {
      return (
        <Paper
          style={{
            width: "100%",
            maxWidth: 420,
            padding: 16,
            borderRadius: 12,
            gap: 16,
          }}
          elevation={app.settings?.preferEmbossed ? 4 : 2}
        >
          <Typography level="body-md" weight={700}>
            {t("actions.editInviteLink")}
          </Typography>

          <ScrollView contentContainerStyle={{ gap: 16 }}>
            <Box style={{ gap: 8 }}>
              <Typography level="body-sm" weight={600}>
                {t("invites.modal.expireAfter")}
              </Typography>
              <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {expirations.map((opt) => (
                  <Button
                    key={String(opt.value)}
                    size="sm"
                    variant={expiresAfter === opt.value ? "soft" : "plain"}
                    onPress={() => setExpiresAfter(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </Box>
            </Box>

            <Box style={{ gap: 8 }}>
              <Typography level="body-sm" weight={600}>
                {t("invites.modal.maxUses")}
              </Typography>
              <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {maxUsesOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    size="sm"
                    variant={maxUsesAfter === opt.value ? "soft" : "plain"}
                    onPress={() => setMaxUsesAfter(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </Box>
            </Box>
          </ScrollView>

          <Box style={{ flexDirection: "row", gap: 8 }}>
            <Button
              expand
              variant="soft"
              color="neutral"
              onPress={() => {
                setEditing(false);
                setEditSessionId(null);
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              expand
              color="success"
              disabled={saving || !invite}
              onPress={() => updateInvite()}
            >
              {saving ? tSettings("profile.saving") : tCommon("save")}
            </Button>
          </Box>
        </Paper>
      );
    }

    return (
      <Paper
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        <Box style={{ gap: 4 }}>
          <Typography level="body-md" weight={700}>
            {t("invites.modal.title", { spaceName: space.name })}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {t("invites.modal.landingChannel", {
              channelName: channelToUse?.name ?? "general",
            })}
          </Typography>
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-sm" weight={600}>
            {t("invites.modal.inviteLink")}
          </Typography>

          {isLoading ? (
            <Typography level="body-sm" textColor="muted">
              {t("actions.creating")}
            </Typography>
          ) : (
            <Pressable onPress={() => void copyInviteLink()} disabled={!!error}>
              <Typography
                level="body-sm"
                color={error ? "danger" : undefined}
                style={{ fontFamily: "monospace" }}
              >
                {error?.message ?? inviteUrl}
              </Typography>
            </Pressable>
          )}

          {!isLoading && !error && invite && (
            <Typography level="body-xs" textColor="muted">
              {t("invites.modal.expiresPrefix")}
              {invite.expiresAt ? dayjs(invite.expiresAt).fromNow() : t("invites.modal.expiresNever")}
              {invite.maxUses > 0
                ? t("invites.modal.expiresAfterUses", { count: invite.maxUses })
                : ""}
              .
            </Typography>
          )}
        </Box>

        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button
            expand
            variant="soft"
            startDecorator={<CopyIcon size={16} />}
            disabled={isLoading || !!error || !invite || copied}
            onPress={() => void copyInviteLink()}
          >
            {copied ? t("invites.copiedToClipboard") : t("invites.copyInviteUrl")}
          </Button>
          {!isLoading && !error && invite && (
            <Button expand variant="plain" onPress={() => setEditing(true)}>
              {t("actions.editInviteLink")}
            </Button>
          )}
        </Box>

        {onClose && (
          <Button variant="plain" color="neutral" onPress={onClose}>
            {tSettings("profile.done")}
          </Button>
        )}
      </Paper>
    );
  },
);
