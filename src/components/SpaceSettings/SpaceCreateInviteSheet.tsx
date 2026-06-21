import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { ChannelType } from "@mutualzz/types";
import { Box, Button, Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { Invite } from "@stores/objects/Invite";
import * as Clipboard from "expo-clipboard";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable } from "react-native";

interface Props {
    space: Space;
    modalId?: string;
    onClose?: () => void;
}

export const SpaceCreateInviteSheet = observer(
    ({ space, modalId = "space-create-invite", onClose }: Props) => {
        const app = useAppStore();
        const { closeModal } = useModal();
        const close = onClose ?? (() => closeModal(modalId));
        const [creating, setCreating] = useState(false);
        const [inviteUrl, setInviteUrl] = useState<string | null>(null);
        const [error, setError] = useState<string | null>(null);
        const [copied, setCopied] = useState(false);

        const createInvite = async () => {
            setCreating(true);
            setError(null);

            try {
                const channel =
                    space.firstNavigableChannel ??
                    space.visibleChannels.find(
                        (item) => item.type === ChannelType.Text,
                    );

                const created = await space.createInvite(channel?.id);
                if (!created) return;

                space.addInvite(created);
                setInviteUrl(Invite.constructUrl(created.code));
            } catch (e) {
                setError(
                    e instanceof Error ? e.message : "Failed to create invite",
                );
            } finally {
                setCreating(false);
            }
        };

        const copyLink = async () => {
            if (!inviteUrl) return;
            await Clipboard.setStringAsync(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
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
                    Create invite link
                </Typography>

                {inviteUrl ? (
                    <Box style={{ gap: 8 }}>
                        <Pressable onPress={() => void copyLink()}>
                            <Typography
                                level="body-sm"
                                style={{ fontFamily: "monospace" }}
                            >
                                {inviteUrl}
                            </Typography>
                        </Pressable>
                        <Typography level="body-xs" textColor="muted">
                            {copied ? "Copied!" : "Tap the link to copy"}
                        </Typography>
                        <Button
                            color="neutral"
                            variant="soft"
                            onPress={close}
                        >
                            Done
                        </Button>
                    </Box>
                ) : (
                    <Box style={{ gap: 8 }}>
                        <Typography level="body-sm" textColor="muted">
                            Creates a link to the default text channel for this
                            space.
                        </Typography>
                        {error && (
                            <Typography
                                level="body-sm"
                                style={{ color: "#e74c3c" }}
                            >
                                {error}
                            </Typography>
                        )}
                        <Button
                            disabled={creating}
                            onPress={() => void createInvite()}
                        >
                            {creating ? "Creating..." : "Create invite"}
                        </Button>
                        <Button
                            variant="soft"
                            color="neutral"
                            disabled={creating}
                            onPress={close}
                        >
                            Cancel
                        </Button>
                    </Box>
                )}
            </Paper>
        );
    },
);
