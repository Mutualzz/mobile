import { Paper } from "@components/Paper";
import { Button } from "@components/Button";
import { Screen } from "@components/Screen/Screen";
import { StaffHeader } from "@components/Staff/StaffHeader";
import { useRequireStaffAccess } from "@hooks/useRequireStaffAccess";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { APIStaffAction } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import { ClockCounterClockwiseIcon } from "phosphor-react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Href } from "expo-router";
import { observer } from "mobx-react-lite";
import { Pressable, ScrollView } from "react-native";
import dayjs from "dayjs";

const PAGE_LIMIT = 50;

const actionVerbs: Record<string, string> = {
    "user.disable": "disabled",
    "user.enable": "enabled",
    "user.force_logout": "forced a logout on",
    "user.session_revoke": "revoked a session on",
    "user.profile_update": "updated the profile of",
    "user.verify_reminder_sent": "sent a verification reminder to",
};

const describeGlobalAction = (entry: APIStaffAction) => {
    const actorName = entry.actor.globalName || entry.actor.username;
    const targetName = entry.target.globalName || entry.target.username;

    if (actionVerbs[entry.action]) {
        return `${actorName} ${actionVerbs[entry.action]} ${targetName}`;
    }

    const flagMatch = entry.action.match(/^user\.flag\.(.+)\.(grant|revoke)$/);
    if (flagMatch) {
        const [, flag, verb] = flagMatch;
        return verb === "grant"
            ? `${actorName} granted the ${flag} flag to ${targetName}`
            : `${actorName} revoked the ${flag} flag from ${targetName}`;
    }

    const takedownMatch = entry.action.match(/^content\.takedown\.(.+)$/);
    if (takedownMatch) {
        return `${actorName} took down a reported ${takedownMatch[1]} from ${targetName}`;
    }

    return `${actorName} performed ${entry.action} on ${targetName}`;
};

const StaffActivityScreen = () => {
    const { isStaff } = useRequireStaffAccess();
    const app = useAppStore();
    const { navigate } = useAppNavigation();

    const {
        data,
        isFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["staff-all-actions"],
        queryFn: ({ pageParam }) =>
            app.rest.get<APIStaffAction[]>("/staff/actions", {
                ...(pageParam ? { before: pageParam } : {}),
                limit: PAGE_LIMIT,
            }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.length === PAGE_LIMIT
                ? lastPage[lastPage.length - 1].id
                : undefined,
    });

    const actions = data?.pages.flat() ?? [];

    if (!isStaff) return null;

    return (
        <Screen style={{ flexDirection: "column" }}>
            <StaffHeader title="Staff Activity" showBack />
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                {isFetching && !isFetchingNextPage && (
                    <Typography level="body-sm" textColor="muted">
                        Loading...
                    </Typography>
                )}

                {!isFetching && actions.length === 0 && (
                    <Typography level="body-sm" textColor="muted">
                        No staff actions yet
                    </Typography>
                )}

                {actions.map((entry) => (
                    <Pressable
                        key={entry.id}
                        onPress={() =>
                            navigate(
                                `/staff/users/${entry.target.id}` as Href,
                            )
                        }
                    >
                        <Paper
                            variant="plain"
                            style={{
                                padding: 12,
                                borderRadius: 10,
                                flexDirection: "row",
                                gap: 10,
                                alignItems: "flex-start",
                            }}
                        >
                            <ClockCounterClockwiseIcon
                                size={16}
                                style={{ marginTop: 3, opacity: 0.6 }}
                            />
                            <Box style={{ flex: 1, gap: 2 }}>
                                <Typography level="body-sm">
                                    {describeGlobalAction(entry)}
                                </Typography>
                                {entry.reason && (
                                    <Typography
                                        level="body-xs"
                                        textColor="muted"
                                    >
                                        {entry.reason}
                                    </Typography>
                                )}
                                <Typography
                                    level="body-xs"
                                    textColor="muted"
                                >
                                    {dayjs(entry.createdAt).format(
                                        "MMM D, YYYY h:mm A",
                                    )}
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
                        {isFetchingNextPage ? "Loading..." : "Load more"}
                    </Button>
                )}
            </ScrollView>
        </Screen>
    );
};

export default observer(StaffActivityScreen);
