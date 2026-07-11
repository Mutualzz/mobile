import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import type { Channel } from "@stores/objects/Channel";
import { Invite } from "@stores/objects/Invite";
import * as Clipboard from "expo-clipboard";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Pressable } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  space: Space;
  channel?: Channel | null;
  modalId?: string;
  onClose?: () => void;
}

export const SpaceCreateInviteSheet = observer(
  ({ space, channel, modalId = "space-create-invite", onClose }: Props) => {
    const { t } = useTranslation("space");
    const { t: tSettings } = useTranslation("settings");
    const { t: tCommon } = useTranslation("common");
    const app = useAppStore();
    const { closeModal } = useModal();
    const close = onClose ?? (() => closeModal(modalId));
    const [creating, setCreating] = useState(false);
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
      () => () => {
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
      },
      [],
    );

    const createInvite = async () => {
      setCreating(true);
      setError(null);

      try {
        const targetChannel =
          channel ??
          space.firstNavigableChannel ??
          space.visibleChannels.find((item) => item.type === ChannelType.Text);

        const created = await space.createInvite(targetChannel?.id);
        if (!created) return;

        space.addInvite(created);
        setInviteUrl(Invite.constructUrl(created.code));
      } catch (e) {
        setError(
          e instanceof Error ? e.message : t("invites.createFailed"),
        );
      } finally {
        setCreating(false);
      }
    };

    const copyLink = async () => {
      if (!inviteUrl) return;
      await Clipboard.setStringAsync(inviteUrl);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    };

    return (
      <Paper
        style={{
          width: 320,
          maxWidth: "100%",
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        <Typography level="body-md" weight={700}>
          {t("invites.createTitle")}
        </Typography>

        {inviteUrl ? (
          <Box style={{ gap: 8 }}>
            <Pressable onPress={() => void copyLink()}>
              <Typography level="body-sm" style={{ fontFamily: "monospace" }}>
                {inviteUrl}
              </Typography>
            </Pressable>
            <Typography level="body-xs" textColor="muted">
              {copied ? t("invites.copiedToClipboard") : t("invites.tapToCopy")}
            </Typography>
            <Button color="neutral" variant="soft" onPress={close}>
              {tSettings("profile.done")}
            </Button>
          </Box>
        ) : (
          <Box style={{ gap: 8 }}>
            <Typography level="body-sm" textColor="muted">
              {channel
                ? t("invites.createDescriptionChannel", {
                    channel: channel.name,
                  })
                : t("invites.createDescriptionDefault")}
            </Typography>
            {error && (
              <Typography level="body-sm" color="danger" variant="plain">
                {error}
              </Typography>
            )}
            <Button disabled={creating} onPress={() => void createInvite()}>
              {creating ? t("actions.creating") : t("actions.createInvite")}
            </Button>
            <Button
              variant="soft"
              color="neutral"
              disabled={creating}
              onPress={close}
            >
              {tCommon("cancel")}
            </Button>
          </Box>
        )}
      </Paper>
    );
  },
);
