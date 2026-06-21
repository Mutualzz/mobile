import { MemberKickSheet } from "@components/SpaceSettings/MemberKickSheet";
import { MemberBanSheet } from "@components/SpaceSettings/MemberBanSheet";
import { UserProfileTrigger } from "@components/Profile/UserProfileTrigger";
import { Paper } from "@components/Paper";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { CrownSimpleIcon } from "phosphor-react-native";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ActionSheetIOS, Alert, Platform, Pressable } from "react-native";

interface Props {
    member: SpaceMember;
    space?: Space | null;
    isOwner?: boolean;
}

export const MemberListItem = observer(({ member, space, isOwner }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const user = member.user;
    const [kickOpen, setKickOpen] = useState(false);
    const [banOpen, setBanOpen] = useState(false);
    const nameColor =
        member.highestRole?.color ?? theme.typography.colors.muted;

    if (!user) return null;

    const me = space?.members.me;
    const isSelf = app.account?.id === user.id;
    const canKick =
        !!space &&
        !!me &&
        !isSelf &&
        me.canManageMember(member, "KickMembers");
    const canBan =
        !!space &&
        !!me &&
        !isSelf &&
        me.canManageMember(member, "BanMembers");

    const openModerationMenu = () => {
        if (!canKick && !canBan) return;

        const options = [
            ...(canKick ? ["Kick member"] : []),
            ...(canBan ? ["Ban member"] : []),
            "Cancel",
        ];
        const cancelIndex = options.length - 1;

        const handleSelection = (index: number) => {
            const label = options[index];
            if (label === "Kick member") setKickOpen(true);
            if (label === "Ban member") setBanOpen(true);
        };

        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: cancelIndex,
                    destructiveButtonIndex: canBan
                        ? options.indexOf("Ban member")
                        : canKick
                          ? options.indexOf("Kick member")
                          : undefined,
                },
                (index) => handleSelection(index),
            );
            return;
        }

        Alert.alert(
            member.displayName,
            "Choose a moderation action",
            [
                ...(canKick
                    ? [
                          {
                              text: "Kick member",
                              onPress: () => setKickOpen(true),
                          },
                      ]
                    : []),
                ...(canBan
                    ? [
                          {
                              text: "Ban member",
                              style: "destructive" as const,
                              onPress: () => setBanOpen(true),
                          },
                      ]
                    : []),
                { text: "Cancel", style: "cancel" as const },
            ],
        );
    };

    return (
        <>
            <UserProfileTrigger user={user} member={member}>
                <Pressable onLongPress={openModerationMenu}>
                    <Paper
                        variant="plain"
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                            paddingVertical: 8,
                            paddingHorizontal: 8,
                            borderRadius: 8,
                        }}
                    >
                        <UserAvatar user={user} size="md" badge />
                        <Box
                            style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                                minWidth: 0,
                            }}
                        >
                            <Typography
                                level="body-sm"
                                numberOfLines={1}
                                style={{ flex: 1, color: nameColor }}
                            >
                                {member.displayName}
                            </Typography>
                            {isOwner && (
                                <CrownSimpleIcon
                                    size={14}
                                    color={theme.colors.warning}
                                    weight="fill"
                                />
                            )}
                        </Box>
                    </Paper>
                </Pressable>
            </UserProfileTrigger>

            {space && kickOpen && (
                <MemberKickSheet
                    visible
                    space={space}
                    member={member}
                    onClose={() => setKickOpen(false)}
                />
            )}

            {space && banOpen && (
                <MemberBanSheet
                    visible
                    space={space}
                    member={member}
                    onClose={() => setBanOpen(false)}
                />
            )}
        </>
    );
});
