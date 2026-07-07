import { Button } from "@components/Button";
import { StaffUserDisableConfirmSheet } from "@components/Staff/StaffUserDisableConfirmSheet";
import { StaffUserForceLogoutConfirmSheet } from "@components/Staff/StaffUserForceLogoutConfirmSheet";
import { Screen } from "@components/Screen/Screen";
import { StaffHeader } from "@components/Staff/StaffHeader";
import { UserAvatar } from "@components/User/UserAvatar";
import { useModal } from "@hooks/useModal";
import { useRequireStaffAccess } from "@hooks/useRequireStaffAccess";
import { useAppStore } from "@hooks/useStores";
import {
    staffToggleableUserFlags,
    type StaffToggleableUserFlag,
} from "@mutualzz/bitfield";
import type {
    APIPrivateUser,
    APIStaffAction,
    APIStaffSession,
    HttpException,
} from "@mutualzz/types";
import { Box, Divider, InputDefault, Switch, Typography } from "@mutualzz/ui-native";
import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import dayjs from "dayjs";

const AUDIT_PAGE_LIMIT = 50;

const actionLabels: Record<string, string> = {
    "user.disable": "disabled this account",
    "user.enable": "enabled this account",
    "user.force_logout": "forced a logout on this account",
    "user.session_revoke": "revoked a session on this account",
    "user.profile_update": "updated this account's profile",
    "user.verify_reminder_sent": "sent a verification reminder to this account",
};

const describeAction = (action: string) => {
    if (actionLabels[action]) return actionLabels[action];

    const flagMatch = action.match(/^user\.flag\.(.+)\.(grant|revoke)$/);
    if (flagMatch) {
        const [, flag, verb] = flagMatch;
        return verb === "grant"
            ? `granted the ${flag} flag`
            : `revoked the ${flag} flag`;
    }

    const takedownMatch = action.match(/^content\.takedown\.(.+)$/);
    if (takedownMatch) return `took down a reported ${takedownMatch[1]}`;

    return action;
};

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <Box
            style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
            }}
        >
            <Typography level="body-xs" textColor="muted">
                {label}
            </Typography>
            <Typography level="body-xs">{value}</Typography>
        </Box>
    );
}

const StaffUserScreen = () => {
    const { isStaff } = useRequireStaffAccess();
    const app = useAppStore();
    const { openModal } = useModal();
    const queryClient = useQueryClient();
    const { userId } = useLocalSearchParams<{ userId: string }>();

    const userQueryKey = ["staff-user", userId];

    const {
        data: privateUser,
        isLoading,
        isError,
    } = useQuery({
        queryKey: userQueryKey,
        enabled: !!userId,
        queryFn: () => app.rest.get<APIPrivateUser>(`/staff/users/${userId}`),
    });

    useEffect(() => {
        if (!privateUser) return;
        if (app.users.has(privateUser.id)) app.users.update(privateUser);
        else app.users.add(privateUser);
    }, [privateUser, app.users]);

    const user = privateUser ? app.users.get(privateUser.id) : undefined;

    const [usernameDraft, setUsernameDraft] = useState("");
    const [globalNameDraft, setGlobalNameDraft] = useState("");
    const [profileError, setProfileError] = useState<string | null>(null);

    useEffect(() => {
        if (!privateUser) return;
        setUsernameDraft(privateUser.username);
        setGlobalNameDraft(privateUser.globalName ?? "");
        setProfileError(null);
    }, [privateUser?.id, privateUser?.username, privateUser?.globalName]);

    const actionsQueryKey = ["staff-actions", userId];

    const {
        data: actionsData,
        isFetching: isFetchingActions,
        fetchNextPage: fetchNextActionsPage,
        hasNextPage: hasNextActionsPage,
        isFetchingNextPage: isFetchingNextActionsPage,
    } = useInfiniteQuery({
        queryKey: actionsQueryKey,
        enabled: !!user,
        queryFn: ({ pageParam }) =>
            app.rest.get<APIStaffAction[]>(`/staff/users/${userId}/actions`, {
                ...(pageParam ? { before: pageParam } : {}),
                limit: AUDIT_PAGE_LIMIT,
            }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.length === AUDIT_PAGE_LIMIT
                ? lastPage[lastPage.length - 1].id
                : undefined,
    });

    const actions = actionsData?.pages.flat() ?? [];

    const handleUpdated = (updated: APIPrivateUser) => {
        queryClient.setQueryData(userQueryKey, updated);
        queryClient.invalidateQueries({ queryKey: actionsQueryKey });
    };

    const sessionsQueryKey = ["staff-sessions", userId];

    const { data: sessions = [] } = useQuery({
        queryKey: sessionsQueryKey,
        enabled: !!user,
        queryFn: () =>
            app.rest.get<APIStaffSession[]>(
                `/staff/users/${userId}/sessions`,
            ),
    });

    const handleForcedLogout = () => {
        queryClient.invalidateQueries({ queryKey: actionsQueryKey });
        queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    };

    const { mutate: revokeSession, isPending: revokingSession } = useMutation({
        mutationKey: ["staff-revoke-session", userId],
        mutationFn: (sessionId: string) =>
            app.rest.delete(`/staff/users/${userId}/sessions/${sessionId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
            queryClient.invalidateQueries({ queryKey: actionsQueryKey });
        },
    });

    const { mutate: setFlag, isPending: settingFlag } = useMutation({
        mutationKey: ["staff-set-flag", userId],
        mutationFn: ({
            flag,
            enabled,
        }: {
            flag: StaffToggleableUserFlag;
            enabled: boolean;
        }) =>
            app.rest.patch<APIPrivateUser>(
                `/staff/users/${userId}/flags/${flag}`,
                { enabled },
            ),
        onSuccess: handleUpdated,
    });

    const trimmedUsername = usernameDraft.trim();
    const trimmedGlobalName = globalNameDraft.trim();
    const usernameChanged = privateUser
        ? trimmedUsername !== privateUser.username
        : false;
    const globalNameChanged = privateUser
        ? trimmedGlobalName !== (privateUser.globalName ?? "")
        : false;

    const { mutate: saveProfile, isPending: savingProfile } = useMutation({
        mutationKey: ["staff-update-profile", userId],
        mutationFn: () =>
            app.rest.patch<APIPrivateUser>(`/staff/users/${userId}/profile`, {
                ...(usernameChanged ? { username: trimmedUsername } : {}),
                ...(globalNameChanged
                    ? { globalName: trimmedGlobalName || null }
                    : {}),
            }),
        onSuccess: (updated) => {
            setProfileError(null);
            handleUpdated(updated);
        },
        onError: (err: HttpException) => {
            setProfileError(err.message);
        },
    });

    const [reminderMessage, setReminderMessage] = useState<{
        text: string;
        error: boolean;
    } | null>(null);

    const { mutate: sendVerifyReminder, isPending: sendingReminder } =
        useMutation({
            mutationKey: ["staff-verify-reminder", userId],
            mutationFn: () =>
                app.rest.post(`/staff/users/${userId}/verify-reminder`),
            onSuccess: () =>
                setReminderMessage({
                    text: "Verification reminder sent",
                    error: false,
                }),
            onError: (err: HttpException) =>
                setReminderMessage({ text: err.message, error: true }),
        });

    if (!isStaff) return null;

    if (isLoading) {
        return (
            <Screen style={{ flexDirection: "column" }}>
                <StaffHeader title="Staff" showBack />
                <Box
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <ActivityIndicator />
                </Box>
            </Screen>
        );
    }

    if (isError || !user || !privateUser) {
        return (
            <Screen style={{ flexDirection: "column" }}>
                <StaffHeader title="Staff" showBack />
                <Box
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Typography textColor="muted">User not found</Typography>
                </Box>
            </Screen>
        );
    }

    const isDisabled = user.flags.has("Disabled");

    return (
        <Screen style={{ flexDirection: "column" }}>
            <StaffHeader title={user.displayName} showBack />
            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
                <Box
                    style={{
                        flexDirection: "row",
                        gap: 12,
                        alignItems: "center",
                    }}
                >
                    <UserAvatar user={user} size="lg" />
                    <Box style={{ gap: 2 }}>
                        <Typography level="title-md">
                            {user.displayName}
                        </Typography>
                        <Typography level="body-sm" textColor="muted">
                            @{user.username} · {user.id}
                        </Typography>
                    </Box>
                </Box>

                <Divider lineColor="muted" style={{ opacity: 0.35 }} />

                <Box style={{ gap: 8 }}>
                    <Typography level="body-md" weight={700}>
                        Info
                    </Typography>
                    <Box style={{ gap: 4 }}>
                        <Typography level="body-xs" textColor="muted">
                            Username
                        </Typography>
                        <InputDefault
                            fullWidth
                            autoCapitalize="none"
                            value={usernameDraft}
                            onChangeText={setUsernameDraft}
                        />
                    </Box>
                    <Box style={{ gap: 4 }}>
                        <Typography level="body-xs" textColor="muted">
                            Display Name
                        </Typography>
                        <InputDefault
                            fullWidth
                            placeholder="No display name set"
                            value={globalNameDraft}
                            onChangeText={setGlobalNameDraft}
                        />
                    </Box>
                    {profileError && (
                        <Typography level="body-sm" color="danger">
                            {profileError}
                        </Typography>
                    )}
                    <Button
                        color="primary"
                        disabled={
                            savingProfile ||
                            !trimmedUsername ||
                            (!usernameChanged && !globalNameChanged)
                        }
                        onPress={() => saveProfile()}
                    >
                        Save Changes
                    </Button>

                    <Box style={{ gap: 4, marginTop: 8 }}>
                        <DetailRow label="Email" value={privateUser.email} />
                        <Box
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <Typography level="body-xs" textColor="muted">
                                Email Verified
                            </Typography>
                            {user.flags.has("Verified") ? (
                                <Typography level="body-xs">Yes</Typography>
                            ) : (
                                <Button
                                    size="sm"
                                    color="primary"
                                    variant="soft"
                                    disabled={sendingReminder}
                                    onPress={() => sendVerifyReminder()}
                                >
                                    Send Reminder
                                </Button>
                            )}
                        </Box>
                        {reminderMessage && (
                            <Typography
                                level="body-xs"
                                color={
                                    reminderMessage.error
                                        ? "danger"
                                        : undefined
                                }
                                textColor={
                                    reminderMessage.error ? undefined : "muted"
                                }
                            >
                                {reminderMessage.text}
                            </Typography>
                        )}
                        <DetailRow label="User ID" value={privateUser.id} />
                        <DetailRow
                            label="Date of Birth"
                            value={dayjs(privateUser.dateOfBirth).format(
                                "MMM D, YYYY",
                            )}
                        />
                        <DetailRow
                            label="Created"
                            value={dayjs(privateUser.createdAt).format(
                                "MMM D, YYYY h:mm A",
                            )}
                        />
                    </Box>
                </Box>

                <Divider lineColor="muted" style={{ opacity: 0.35 }} />

                <Box style={{ gap: 8 }}>
                    <Typography level="body-md" weight={700}>
                        Flags
                    </Typography>
                    <Typography level="body-sm" textColor="muted">
                        {user.flags.toArray().length
                            ? user.flags.toArray().join(", ")
                            : "No flags set"}
                    </Typography>
                </Box>

                {app.account?.isFounder && (
                <Box style={{ gap: 8 }}>
                    <Typography level="body-md" weight={700}>
                        Manage Flags
                    </Typography>
                    {staffToggleableUserFlags.map((flag, index) => (
                        <Box key={flag} style={{ gap: 8 }}>
                            <Pressable
                                onPress={() =>
                                    setFlag({
                                        flag,
                                        enabled: !user.flags.has(flag),
                                    })
                                }
                            >
                                <Box
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                    }}
                                >
                                    <Typography level="body-sm">
                                        {flag}
                                    </Typography>
                                    <Switch
                                        checked={user.flags.has(flag)}
                                        disabled={settingFlag}
                                        onChange={() =>
                                            setFlag({
                                                flag,
                                                enabled: !user.flags.has(
                                                    flag,
                                                ),
                                            })
                                        }
                                    />
                                </Box>
                            </Pressable>
                            {index < staffToggleableUserFlags.length - 1 ? (
                                <Divider
                                    lineColor="muted"
                                    style={{ opacity: 0.25 }}
                                />
                            ) : null}
                        </Box>
                    ))}
                </Box>
                )}

                <Divider lineColor="muted" style={{ opacity: 0.35 }} />

                <Box style={{ gap: 8 }}>
                    <Typography level="body-md" weight={700}>
                        Actions
                    </Typography>
                    <Button
                        color="danger"
                        onPress={() =>
                            openModal(
                                `staff-disable-user-${user.id}`,
                                <StaffUserDisableConfirmSheet
                                    userId={user.id}
                                    username={user.username}
                                    disable={!isDisabled}
                                    onSuccess={handleUpdated}
                                    modalId={`staff-disable-user-${user.id}`}
                                />,
                            )
                        }
                    >
                        {isDisabled ? "Enable Account" : "Disable Account"}
                    </Button>
                    <Button
                        color="danger"
                        onPress={() =>
                            openModal(
                                `staff-force-logout-user-${user.id}`,
                                <StaffUserForceLogoutConfirmSheet
                                    userId={user.id}
                                    username={user.username}
                                    onSuccess={handleForcedLogout}
                                    modalId={`staff-force-logout-user-${user.id}`}
                                />,
                            )
                        }
                    >
                        Force Logout
                    </Button>
                </Box>

                <Divider lineColor="muted" style={{ opacity: 0.35 }} />

                <Box style={{ gap: 8 }}>
                    <Typography level="body-md" weight={700}>
                        Active Sessions
                    </Typography>
                    {sessions.length === 0 ? (
                        <Typography level="body-sm" textColor="muted">
                            No active sessions
                        </Typography>
                    ) : (
                        <Box style={{ gap: 12 }}>
                            {sessions.map((session) => (
                                <Box
                                    key={session.sessionId}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                    }}
                                >
                                    <Box style={{ gap: 2 }}>
                                        <Typography level="body-sm">
                                            Created{" "}
                                            {dayjs(
                                                session.createdAt,
                                            ).fromNow()}
                                        </Typography>
                                        <Typography
                                            level="body-xs"
                                            textColor="muted"
                                        >
                                            Last used{" "}
                                            {dayjs(
                                                session.lastUsedAt,
                                            ).fromNow()}
                                        </Typography>
                                    </Box>
                                    <Button
                                        size="sm"
                                        color="danger"
                                        variant="soft"
                                        disabled={revokingSession}
                                        onPress={() =>
                                            revokeSession(session.sessionId)
                                        }
                                    >
                                        Revoke
                                    </Button>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>

                <Divider lineColor="muted" style={{ opacity: 0.35 }} />

                <Box style={{ gap: 8 }}>
                    <Typography level="body-md" weight={700}>
                        Audit Log
                    </Typography>
                    {!isFetchingActions && actions.length === 0 ? (
                        <Typography level="body-sm" textColor="muted">
                            No staff actions yet
                        </Typography>
                    ) : (
                        <Box style={{ gap: 12 }}>
                            {actions.map((entry) => (
                                <Box key={entry.id} style={{ gap: 2 }}>
                                    <Typography level="body-sm">
                                        {entry.actor.globalName ||
                                            entry.actor.username}{" "}
                                        {describeAction(entry.action)}
                                    </Typography>
                                    {entry.reason && (
                                        <Typography
                                            level="body-sm"
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
                            ))}
                            {hasNextActionsPage && (
                                <Button
                                    color="neutral"
                                    variant="soft"
                                    disabled={isFetchingNextActionsPage}
                                    onPress={() => fetchNextActionsPage()}
                                >
                                    {isFetchingNextActionsPage
                                        ? "Loading..."
                                        : "Load more"}
                                </Button>
                            )}
                        </Box>
                    )}
                </Box>
            </ScrollView>
        </Screen>
    );
};

export default observer(StaffUserScreen);
