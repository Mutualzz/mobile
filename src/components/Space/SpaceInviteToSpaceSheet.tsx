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

interface Props {
  space: Space;
  channel?: Channel | null;
  onClose?: () => void;
}

type CreateInviteResponse = APIInvite & { editSessionId?: string };

const expirations = [
  { label: "30 minutes", value: 1800 },
  { label: "1 hour", value: 3600 },
  { label: "6 hours", value: 21600 },
  { label: "12 hours", value: 43200 },
  { label: "1 day", value: 86400 },
  { label: "7 days", value: 604800 },
  { label: "Never", value: null },
] as const;

const maxUsesOptions = [
  { label: "No limit", value: 0 },
  { label: "1 use", value: 1 },
  { label: "5 uses", value: 5 },
  { label: "10 uses", value: 10 },
  { label: "25 uses", value: 25 },
  { label: "50 uses", value: 50 },
  { label: "100 uses", value: 100 },
] as const;

export const SpaceInviteToSpaceSheet = observer(
  ({ space, channel, onClose }: Props) => {
    const app = useAppStore();
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
            Edit invite link
          </Typography>

          <ScrollView contentContainerStyle={{ gap: 16 }}>
            <Box style={{ gap: 8 }}>
              <Typography level="body-sm" weight={600}>
                Expire after
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
                Max uses
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
              Cancel
            </Button>
            <Button
              expand
              color="success"
              disabled={saving || !invite}
              onPress={() => updateInvite()}
            >
              {saving ? "Saving…" : "Save"}
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
            Invite friends to {space.name}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            Recipients will land in #{channelToUse?.name ?? "general"}
          </Typography>
        </Box>

        <Box style={{ gap: 8 }}>
          <Typography level="body-sm" weight={600}>
            Invite link
          </Typography>

          {isLoading ? (
            <Typography level="body-sm" textColor="muted">
              Creating invite…
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
              This link will expire{" "}
              {invite.expiresAt ? dayjs(invite.expiresAt).fromNow() : "never"}
              {invite.maxUses > 0 ? ` or after ${invite.maxUses} uses` : ""}.
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
            {copied ? "Copied" : "Copy"}
          </Button>
          {!isLoading && !error && invite && (
            <Button expand variant="plain" onPress={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </Box>

        {onClose && (
          <Button variant="plain" color="neutral" onPress={onClose}>
            Done
          </Button>
        )}
      </Paper>
    );
  },
);
