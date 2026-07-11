import { Paper } from "@components/Paper";
import { Screen } from "@components/Screen/Screen";
import { StaffHeader } from "@components/Staff/StaffHeader";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useDebouncedEffect } from "@hooks/useDebouncedEffect";
import { useRequireStaffAccess } from "@hooks/useRequireStaffAccess";
import { useAppStore } from "@hooks/useStores";
import { userFlags } from "@mutualzz/bitfield";
import type { APIUser } from "@mutualzz/types";
import { Box, Input, Typography } from "@mutualzz/ui-native";
import { Button } from "@components/Button";
import {
    ClockCounterClockwiseIcon,
    GavelIcon,
    WarningIcon,
} from "phosphor-react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Href } from "expo-router";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";

const ANY_FLAG = "any";
const UNVERIFIED_FLAG = "Unverified";
const flagOptions = [ANY_FLAG, UNVERIFIED_FLAG, ...Object.keys(userFlags)];
const PAGE_LIMIT = 25;

const StaffIndexScreen = () => {
    const { t } = useTranslation("staff");
    const { isStaff } = useRequireStaffAccess();
    const app = useAppStore();
    const { navigate } = useAppNavigation();

    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [flag, setFlag] = useState<string>(ANY_FLAG);

    useDebouncedEffect(
        () => {
            setDebouncedQuery(query);
        },
        [query],
        400,
    );

    const trimmedQuery = debouncedQuery.trim();
    const effectiveFlag = flag === ANY_FLAG ? undefined : flag;
    const isSnowflake = /^\d{5,}$/.test(trimmedQuery);

    const {
        data,
        isFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["staff-user-search", trimmedQuery, effectiveFlag],
        queryFn: async ({ pageParam }) => {
            const users = await app.rest.get<APIUser[]>("/staff/users", {
                ...(trimmedQuery ? { query: trimmedQuery } : {}),
                ...(effectiveFlag ? { flag: effectiveFlag } : {}),
                ...(pageParam ? { after: pageParam } : {}),
                limit: PAGE_LIMIT,
            });
            return app.users.addAll(users);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.length === PAGE_LIMIT
                ? lastPage[lastPage.length - 1].username
                : undefined,
        enabled: isStaff && (!!trimmedQuery || !!effectiveFlag),
    });

    const results = data?.pages.flat() ?? [];

    const goToUser = (userId: string) =>
        navigate(`/staff/users/${userId}` as Href);

    if (!isStaff) return null;

    return (
        <Screen style={{ flexDirection: "column" }}>
            <StaffHeader title={t("title")} />
            <ScrollView
                contentContainerStyle={{ padding: 16, gap: 16 }}
                keyboardShouldPersistTaps="handled"
            >
                <Box
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <Typography
                        level="body-sm"
                        textColor="muted"
                        style={{ flex: 1 }}
                    >
                        {t("home.findUserDescription")}
                    </Typography>
                    <Box style={{ gap: 8 }}>
                        <Button
                            size="sm"
                            color="neutral"
                            variant="soft"
                            startDecorator={<WarningIcon size={16} />}
                            onPress={() => navigate("/staff/reports" as Href)}
                        >
                            {t("nav.reports")}
                        </Button>
                        <Button
                            size="sm"
                            color="neutral"
                            variant="soft"
                            startDecorator={
                                <ClockCounterClockwiseIcon size={16} />
                            }
                            onPress={() => navigate("/staff/activity" as Href)}
                        >
                            {t("nav.activity")}
                        </Button>
                        <Button
                            size="sm"
                            color="neutral"
                            variant="soft"
                            startDecorator={<GavelIcon size={16} />}
                            onPress={() => navigate("/staff/appeals" as Href)}
                        >
                            {t("nav.appeals")}
                        </Button>
                    </Box>
                </Box>

                <Input
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t("home.searchPlaceholder")}
                    autoCapitalize="none"
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Box style={{ flexDirection: "row", gap: 8 }}>
                        {flagOptions.map((f) => (
                            <Button
                                key={f}
                                size="sm"
                                variant={flag === f ? "solid" : "soft"}
                                color={flag === f ? "primary" : "neutral"}
                                onPress={() => setFlag(f)}
                            >
                                {f === ANY_FLAG ? t("home.anyFlag") : f}
                            </Button>
                        ))}
                    </Box>
                </ScrollView>

                {isSnowflake && (
                    <Pressable onPress={() => goToUser(trimmedQuery)}>
                        <Paper
                            variant="plain"
                            style={{ padding: 12, borderRadius: 10 }}
                        >
                            <Typography level="body-sm">
                                {t("home.goToUserId", { id: trimmedQuery })}
                            </Typography>
                        </Paper>
                    </Pressable>
                )}

                {isFetching && !isFetchingNextPage && (
                    <Typography level="body-sm" textColor="muted">
                        {t("home.searching")}
                    </Typography>
                )}

                {!isFetching &&
                    (trimmedQuery || effectiveFlag) &&
                    results.length === 0 &&
                    !isSnowflake && (
                        <Typography level="body-sm" textColor="muted">
                            {t("home.noUsers")}
                        </Typography>
                    )}

                <Box style={{ gap: 8 }}>
                    {results.map((user) => (
                        <Pressable
                            key={user.id}
                            onPress={() => goToUser(user.id)}
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
                                <UserAvatar user={user} size="md" />
                                <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
                                    <Typography
                                        level="body-sm"
                                        weight={700}
                                        truncate="single"
                                    >
                                        {user.displayName}
                                    </Typography>
                                    <Typography
                                        level="body-xs"
                                        textColor="muted"
                                        truncate="single"
                                    >
                                        @{user.username}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Pressable>
                    ))}
                    {hasNextPage && (
                        <Button
                            color="neutral"
                            variant="soft"
                            disabled={isFetchingNextPage}
                            onPress={() => fetchNextPage()}
                        >
                            {isFetchingNextPage
                                ? t("home.loading")
                                : t("home.loadMore")}
                        </Button>
                    )}
                </Box>
            </ScrollView>
        </Screen>
    );
};

export default observer(StaffIndexScreen);
