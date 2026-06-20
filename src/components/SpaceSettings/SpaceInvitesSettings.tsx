import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { SpaceCreateInviteSheet } from "@components/SpaceSettings/SpaceCreateInviteSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { Box, Button, Divider, Typography } from "@mutualzz/ui-native";
import type { Invite } from "@stores/objects/Invite";
import type { Space } from "@stores/objects/Space";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { observer } from "mobx-react-lite";
import { CopyIcon, TrashIcon } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";

interface Props {
    space: Space;
}

function pad(num: number) {
    return num.toString().padStart(2, "0");
}

function formatCountdown(expiresAt: Date, now: Date) {
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return "Expired";

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

const InviteRow = observer(
    ({ invite, now }: { invite: Invite; now: Date }) => {
        const app = useAppStore();
        const [copied, setCopied] = useState(false);

        const copyInviteLink = async () => {
            await Clipboard.setStringAsync(invite.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
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
                    {invite.inviter ? (
                        <UserAvatar
                            user={invite.inviter}
                            size="md"
                        />
                    ) : null}
                    <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Typography level="body-sm" numberOfLines={1}>
                            {invite.inviter?.displayName ?? "Unknown"}
                        </Typography>
                        {invite.channel ? (
                            <Typography
                                level="body-xs"
                                textColor="muted"
                                numberOfLines={1}
                            >
                                #{invite.channel.name}
                            </Typography>
                        ) : null}
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
                        numberOfLines={1}
                    >
                        {invite.code}
                    </Typography>
                    <IconButton
                        padding={6}
                        size={16}
                        color="neutral"
                        variant="soft"
                        onPress={() => void copyInviteLink()}
                        accessibilityLabel="Copy invite link"
                    >
                        <CopyIcon weight="fill" />
                    </IconButton>
                    {copied ? (
                        <Typography level="body-xs" textColor="muted">
                            Copied
                        </Typography>
                    ) : null}
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
                        Uses: {invite.uses}
                        {invite.maxUses === 0 ? "" : ` / ${invite.maxUses}`}
                    </Typography>
                    <Typography level="body-xs" textColor="muted">
                        {invite.expiresAt
                            ? formatCountdown(invite.expiresAt, now)
                            : "Never expires"}
                    </Typography>
                    <IconButton
                        padding={6}
                        size={16}
                        color="danger"
                        variant="soft"
                        onPress={() => void invite.delete()}
                        accessibilityLabel="Delete invite"
                    >
                        <TrashIcon weight="fill" />
                    </IconButton>
                </Box>
            </Paper>
        );
    },
);

export const SpaceInvitesSettings = observer(({ space }: Props) => {
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

    const invites = space.inviteList;

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
                    Active invite links
                </Typography>
                <Box style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    <Button
                        size="sm"
                        color="danger"
                        variant="soft"
                        disabled={invites.length === 0}
                        onPress={() => void space.deleteAll()}
                    >
                        Delete all
                    </Button>
                    <Button
                        size="sm"
                        onPress={() =>
                            openModal(
                                "space-create-invite",
                                <SpaceCreateInviteSheet space={space} />,
                            )
                        }
                    >
                        Create invite
                    </Button>
                </Box>
            </Box>

            {invites.length === 0 ? (
                <Typography
                    level="body-sm"
                    textColor="muted"
                    style={{ textAlign: "center", paddingVertical: 32 }}
                >
                    No invites have been created for this space yet.
                </Typography>
            ) : (
                <Box style={{ gap: 8 }}>
                    {invites.map((invite, index) => (
                        <Box key={invite.code} style={{ gap: 8 }}>
                            <InviteRow invite={invite} now={now} />
                            {index < invites.length - 1 ? (
                                <Divider lineColor="muted" style={{ opacity: 0.25 }} />
                            ) : null}
                        </Box>
                    ))}
                </Box>
            )}
        </ScrollView>
    );
});
