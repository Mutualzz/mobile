import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { SpaceMemberUnbanSheet } from "@components/SpaceSettings/SpaceMemberUnbanSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { useModal } from "@hooks/useModal";
import { Box, Input, Typography } from "@mutualzz/ui-native";
import type { SpaceBan } from "@stores/objects/SpaceBan";
import type { Space } from "@stores/objects/Space";
import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
    space: Space;
}

const BanRow = observer(({ ban, space }: { ban: SpaceBan; space: Space }) => {
    const { openModal } = useModal();

    return (
        <Pressable
            onPress={() =>
                openModal(
                    `space-ban-${ban.userId}`,
                    <SpaceMemberUnbanSheet ban={ban} space={space} />,
                )
            }
        >
            <Paper
                variant="plain"
                style={{
                    padding: 12,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    minWidth: 0,
                }}
            >
                <UserAvatar user={ban.user} size="md" />
                <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Typography level="body-sm" weight={700} truncate="single">
                        {ban.user?.displayName ?? ban.userId}
                    </Typography>
                    <Typography level="body-xs" textColor="muted" truncate="single">
                        @{ban.user?.username ?? ban.userId}
                    </Typography>
                </Box>
            </Paper>
        </Pressable>
    );
});

export const SpaceBansSettings = observer(({ space }: Props) => {
    const { t } = useTranslation("space");
    const [search, setSearch] = useState("");

    useQuery({
        queryKey: ["space-bans", space.id],
        queryFn: () => space.fetchBans(),
    });

    const bans = useMemo(() => {
        const query = search.trim().toLowerCase();
        const list = space.banList;
        if (!query) return list;

        return list.filter(
            (ban) =>
                ban.userId.includes(query) ||
                ban.user?.username?.toLowerCase().includes(query) ||
                ban.user?.displayName?.toLowerCase().includes(query),
        );
    }, [space.banList, search]);

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
                padding: 16,
                paddingBottom: 32,
                gap: 16,
            }}
            keyboardShouldPersistTaps="handled"
        >
            <Box style={{ gap: 8 }}>
                <Typography level="body-md" weight={700}>
                    {t("bans.title")}
                </Typography>
                <Typography level="body-sm" textColor="muted">
                    {t("bans.descriptionShort")}
                </Typography>
            </Box>

            <Input
                value={search}
                onChangeText={setSearch}
                placeholder={t("bans.searchPlaceholderShort")}
                autoCapitalize="none"
            />

            {bans.length === 0 ? (
                <Typography
                    level="body-sm"
                    textColor="muted"
                    style={{ textAlign: "center", paddingVertical: 32 }}
                >
                    {t("bans.empty")}
                </Typography>
            ) : (
                <Box style={{ gap: 8 }}>
                    {bans.map((ban) => (
                        <BanRow key={ban.userId} ban={ban} space={space} />
                    ))}
                </Box>
            )}
        </ScrollView>
    );
});
