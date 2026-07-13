import { Button } from "@components/Button";
import { StaffUserDeleteConfirmSheet } from "@components/Staff/StaffUserDeleteConfirmSheet";
import { StaffUserDisableConfirmSheet } from "@components/Staff/StaffUserDisableConfirmSheet";
import { StaffUserForceLogoutConfirmSheet } from "@components/Staff/StaffUserForceLogoutConfirmSheet";
import { StaffUserRestrictConfirmSheet } from "@components/Staff/StaffUserRestrictConfirmSheet";
import { StaffUserWarnConfirmSheet } from "@components/Staff/StaffUserWarnConfirmSheet";
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
  APIStaffNote,
  APIStaffSession,
  HttpException,
} from "@mutualzz/types";
import {
  Box,
  Divider,
  InputDefault,
  Switch,
  Typography,
} from "@mutualzz/ui-native";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import dayjs from "dayjs";
import type { TFunction } from "i18next";

const AUDIT_PAGE_LIMIT = 50;
const NOTES_PAGE_LIMIT = 50;

const describeAction = (action: string, t: TFunction<"staff">) => {
  const actionLabels: Record<string, string> = {
    "user.disable": t("auditActions.disabledAccount"),
    "user.enable": t("auditActions.enabledAccount"),
    "user.delete": t("auditActions.softDeletedAccount"),
    "user.hard_delete": t("auditActions.hardDeletedAccount"),
    "user.force_logout": t("auditActions.forcedLogout"),
    "user.session_revoke": t("auditActions.revokedSession"),
    "user.profile_update": t("auditActions.updatedProfile"),
    "user.warn": t("auditActions.warnedUser"),
    "user.restrict": t("auditActions.restrictedUser"),
    "user.restrict_lift": t("auditActions.liftedRestriction"),
  };

  if (actionLabels[action]) return actionLabels[action];

  const flagMatch = action.match(/^user\.flag\.(.+)\.(grant|revoke)$/);
  if (flagMatch) {
    const [, flag, verb] = flagMatch;
    return verb === "grant"
      ? t("auditActions.grantedFlag", { flag })
      : t("auditActions.revokedFlag", { flag });
  }

  const takedownMatch = action.match(/^content\.takedown\.(.+)$/);
  if (takedownMatch)
    return t("auditActions.tookDownContent", { type: takedownMatch[1] });

  if (action === "space.delete") return t("auditActions.shutDownSpace");
  if (action === "space.lockdown") return t("auditActions.lockedDownSpace");

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
  const { t } = useTranslation("staff");
  const { t: tSettings } = useTranslation("settings");
  const { isStaff } = useRequireStaffAccess();
  const app = useAppStore();
  const { openModal } = useModal();
  const queryClient = useQueryClient();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

  const userQueryKey = ["staff-user", userId];

  const {
    data: privateUser,
    isLoading,
    isError,
  } = useQuery({
    queryKey: userQueryKey,
    enabled: isStaff && !!userId,
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
    enabled: isStaff && !!user,
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
    enabled: isStaff && !!user,
    queryFn: () =>
      app.rest.get<APIStaffSession[]>(`/staff/users/${userId}/sessions`),
  });

  const handleForcedLogout = () => {
    queryClient.invalidateQueries({ queryKey: actionsQueryKey });
    queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
  };

  const handleWarned = () => {
    queryClient.invalidateQueries({ queryKey: actionsQueryKey });
  };

  const handleHardDeleted = () => {
    queryClient.removeQueries({ queryKey: userQueryKey });
    queryClient.invalidateQueries({ queryKey: ["staff-all-actions"] });
    router.back();
  };

  const { mutate: liftRestriction, isPending: liftingRestriction } =
    useMutation({
      mutationKey: ["staff-lift-restriction", userId],
      mutationFn: () =>
        app.rest.delete<APIPrivateUser>(`/staff/users/${userId}/restrict`),
      onSuccess: handleUpdated,
    });

  const notesQueryKey = ["staff-notes", userId];

  const {
    data: notesData,
    isFetching: isFetchingNotes,
    fetchNextPage: fetchNextNotesPage,
    hasNextPage: hasNextNotesPage,
    isFetchingNextPage: isFetchingNextNotesPage,
  } = useInfiniteQuery({
    queryKey: notesQueryKey,
    enabled: isStaff && !!user,
    queryFn: ({ pageParam }) =>
      app.rest.get<APIStaffNote[]>(`/staff/users/${userId}/notes`, {
        ...(pageParam ? { before: pageParam } : {}),
        limit: NOTES_PAGE_LIMIT,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === NOTES_PAGE_LIMIT
        ? lastPage[lastPage.length - 1].id
        : undefined,
  });

  const notes = notesData?.pages.flat() ?? [];

  const [noteDraft, setNoteDraft] = useState("");

  const { mutate: addNote, isPending: addingNote } = useMutation({
    mutationKey: ["staff-add-note", userId],
    mutationFn: () =>
      app.rest.post<APIStaffNote>(`/staff/users/${userId}/notes`, {
        content: noteDraft.trim(),
      }),
    onSuccess: () => {
      setNoteDraft("");
      queryClient.invalidateQueries({ queryKey: notesQueryKey });
    },
  });

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
      app.rest.patch<APIPrivateUser>(`/staff/users/${userId}/flags/${flag}`, {
        enabled,
      }),
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
        ...(globalNameChanged ? { globalName: trimmedGlobalName || null } : {}),
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
      mutationFn: () => app.rest.post(`/staff/users/${userId}/verify-reminder`),
      onSuccess: () =>
        setReminderMessage({
          text: t("user.info.verifyReminderSent"),
          error: false,
        }),
      onError: (err: HttpException) =>
        setReminderMessage({ text: err.message, error: true }),
    });

  if (!isStaff) return null;

  if (isLoading) {
    return (
      <Screen style={{ flexDirection: "column" }}>
        <StaffHeader title={t("title")} showBack backHref="/staff" />
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
        <StaffHeader title={t("title")} showBack backHref="/staff" />
        <Box
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography textColor="muted">
            {tSettings("profile.viewer.userNotFound")}
          </Typography>
        </Box>
      </Screen>
    );
  }

  const isDisabled = user.flags.has("Disabled");
  const isDeleted = user.flags.has("Deleted");
  const isTargetFounder = user.flags.has("Founder");
  const isRestricted =
    !!privateUser.restrictedUntil &&
    new Date(privateUser.restrictedUntil) > new Date();

  return (
    <Screen style={{ flexDirection: "column" }}>
      <StaffHeader title={user.displayName} showBack backHref="/staff" />
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
            <Typography level="title-md">{user.displayName}</Typography>
            <Typography level="body-sm" textColor="muted">
              @{user.username} · {user.id}
            </Typography>
          </Box>
        </Box>

        <Divider lineColor="muted" style={{ opacity: 0.35 }} />

        <Box style={{ gap: 8 }}>
          <Typography level="body-md" weight={700}>
            {t("sections.info")}
          </Typography>
          {isTargetFounder ? (
            <Typography level="body-sm" textColor="muted">
              {t("user.actions.founderProtectedBanner")}
            </Typography>
          ) : (
            <>
              <Box style={{ gap: 4 }}>
                <Typography level="body-xs" textColor="muted">
                  {t("user.info.username")}
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
                  {t("user.info.displayName")}
                </Typography>
                <InputDefault
                  fullWidth
                  placeholder={t("user.info.noDisplayName")}
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
                {t("user.info.saveChanges")}
              </Button>
            </>
          )}

          <Box style={{ gap: 4, marginTop: 8 }}>
            <DetailRow label={t("user.info.email")} value={privateUser.email} />
            <Box
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Typography level="body-xs" textColor="muted">
                {t("user.info.emailVerified")}
              </Typography>
              {user.flags.has("Verified") ? (
                <Typography level="body-xs">{t("user.info.yes")}</Typography>
              ) : (
                <Button
                  size="sm"
                  color="primary"
                  variant="soft"
                  disabled={sendingReminder}
                  onPress={() => sendVerifyReminder()}
                >
                  {t("user.info.sendReminder")}
                </Button>
              )}
            </Box>
            {reminderMessage && (
              <Typography
                level="body-xs"
                color={reminderMessage.error ? "danger" : undefined}
                textColor={reminderMessage.error ? undefined : "muted"}
              >
                {reminderMessage.text}
              </Typography>
            )}
            <DetailRow label={t("user.info.userId")} value={privateUser.id} />
            <DetailRow
              label={t("user.info.dateOfBirth")}
              value={dayjs(privateUser.dateOfBirth).format("MMM D, YYYY")}
            />
            <DetailRow
              label={t("user.info.created")}
              value={dayjs(privateUser.createdAt).format("MMM D, YYYY h:mm A")}
            />
            {isRestricted && (
              <DetailRow
                label={t("user.info.restrictedUntil")}
                value={dayjs(privateUser.restrictedUntil).format(
                  "MMM D, YYYY h:mm A",
                )}
              />
            )}
          </Box>
        </Box>

        <Divider lineColor="muted" style={{ opacity: 0.35 }} />

        <Box style={{ gap: 8 }}>
          <Typography level="body-md" weight={700}>
            {t("sections.flags")}
          </Typography>
          <Typography level="body-sm" textColor="muted">
            {user.flags.toArray().length
              ? user.flags.toArray().join(", ")
              : t("user.flags.none")}
          </Typography>
        </Box>

        {app.account?.isFounder &&
          (isTargetFounder ? (
            <Typography level="body-sm" textColor="muted">
              {t("user.actions.founderProtectedBanner")}
            </Typography>
          ) : (
            <Box style={{ gap: 8 }}>
              <Typography level="body-md" weight={700}>
                {t("user.flags.manage")}
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
                      <Typography level="body-sm">{flag}</Typography>
                      <Switch
                        checked={user.flags.has(flag)}
                        disabled={settingFlag}
                        onChange={() =>
                          setFlag({
                            flag,
                            enabled: !user.flags.has(flag),
                          })
                        }
                      />
                    </Box>
                  </Pressable>
                  {index < staffToggleableUserFlags.length - 1 && (
                    <Divider lineColor="muted" style={{ opacity: 0.25 }} />
                  )}
                </Box>
              ))}
            </Box>
          ))}

        <Divider lineColor="muted" style={{ opacity: 0.35 }} />

        <Box style={{ gap: 8 }}>
          <Typography level="body-md" weight={700}>
            {t("sections.actions")}
          </Typography>
          {isTargetFounder ? (
            <Typography level="body-sm" textColor="muted">
              {t("user.actions.founderProtectedBanner")}
            </Typography>
          ) : (
            <>
              {isDeleted && (
                <Typography level="body-sm" textColor="muted">
                  {t("user.actions.softDeletedBanner")}
                </Typography>
              )}
              {!isDeleted && (
                <>
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
                    {isDisabled
                      ? t("user.actions.enableAccount")
                      : t("user.actions.disableAccount")}
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
                    {t("user.actions.forceLogout")}
                  </Button>
                  <Button
                    color="warning"
                    onPress={() =>
                      openModal(
                        `staff-warn-user-${user.id}`,
                        <StaffUserWarnConfirmSheet
                          userId={user.id}
                          username={user.username}
                          onSuccess={handleWarned}
                          modalId={`staff-warn-user-${user.id}`}
                        />,
                      )
                    }
                  >
                    {t("user.actions.warnUser")}
                  </Button>
                  {isRestricted ? (
                    <Button
                      color="warning"
                      disabled={liftingRestriction}
                      onPress={() => liftRestriction()}
                    >
                      {t("user.actions.liftRestriction")}
                    </Button>
                  ) : (
                    <Button
                      color="warning"
                      onPress={() =>
                        openModal(
                          `staff-restrict-user-${user.id}`,
                          <StaffUserRestrictConfirmSheet
                            userId={user.id}
                            username={user.username}
                            onSuccess={handleUpdated}
                            modalId={`staff-restrict-user-${user.id}`}
                          />,
                        )
                      }
                    >
                      {t("user.actions.restrictUser")}
                    </Button>
                  )}
                  <Button
                    color="danger"
                    onPress={() =>
                      openModal(
                        `staff-delete-user-${user.id}`,
                        <StaffUserDeleteConfirmSheet
                          userId={user.id}
                          username={user.username}
                          isFounder={!!app.account?.isFounder}
                          onSoftDeleted={handleUpdated}
                          onHardDeleted={handleHardDeleted}
                          modalId={`staff-delete-user-${user.id}`}
                        />,
                      )
                    }
                  >
                    {t("user.actions.softDeleteAccount")}
                  </Button>
                </>
              )}
              {app.account?.isFounder && (
                <Button
                  color="danger"
                  onPress={() =>
                    openModal(
                      `staff-hard-delete-user-${user.id}`,
                      <StaffUserDeleteConfirmSheet
                        userId={user.id}
                        username={user.username}
                        isFounder
                        allowHardDeleteOnly
                        onSoftDeleted={handleUpdated}
                        onHardDeleted={handleHardDeleted}
                        modalId={`staff-hard-delete-user-${user.id}`}
                      />,
                    )
                  }
                >
                  {t("user.actions.hardDeleteAccount")}
                </Button>
              )}
            </>
          )}
        </Box>

        <Divider lineColor="muted" style={{ opacity: 0.35 }} />

        <Box style={{ gap: 8 }}>
          <Typography level="body-md" weight={700}>
            {t("sections.sessions")}
          </Typography>
          {isTargetFounder && (
            <Typography level="body-sm" textColor="muted">
              {t("user.actions.founderProtectedBanner")}
            </Typography>
          )}
          {sessions.length === 0 ? (
            <Typography level="body-sm" textColor="muted">
              {t("user.sessions.empty")}
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
                      {t("user.sessions.created", {
                        relative: dayjs(session.createdAt).fromNow(),
                      })}
                    </Typography>
                    <Typography level="body-xs" textColor="muted">
                      {t("user.sessions.lastUsed", {
                        relative: dayjs(session.lastUsedAt).fromNow(),
                      })}
                    </Typography>
                  </Box>
                  {!isTargetFounder && (
                    <Button
                      size="sm"
                      color="danger"
                      variant="soft"
                      disabled={revokingSession}
                      onPress={() => revokeSession(session.sessionId)}
                    >
                      {t("user.sessions.revoke")}
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Divider lineColor="muted" style={{ opacity: 0.35 }} />

        <Box style={{ gap: 8 }}>
          <Typography level="body-md" weight={700}>
            {t("sections.notes")}
          </Typography>
          <InputDefault
            fullWidth
            multiline
            placeholder={t("user.notes.placeholder")}
            value={noteDraft}
            onChangeText={setNoteDraft}
          />
          <Button
            color="primary"
            variant="soft"
            disabled={addingNote || !noteDraft.trim()}
            onPress={() => addNote()}
          >
            {addingNote ? t("user.notes.adding") : t("user.notes.add")}
          </Button>
          {!isFetchingNotes && notes.length === 0 ? (
            <Typography level="body-sm" textColor="muted">
              {t("user.notes.empty")}
            </Typography>
          ) : (
            <Box style={{ gap: 12 }}>
              {notes.map((note) => (
                <Box key={note.id} style={{ gap: 2 }}>
                  <Typography level="body-sm">{note.content}</Typography>
                  <Typography level="body-xs" textColor="muted">
                    {note.author.globalName || note.author.username}
                    {" · "}
                    {dayjs(note.createdAt).format("MMM D, YYYY h:mm A")}
                  </Typography>
                </Box>
              ))}
              {hasNextNotesPage && (
                <Button
                  color="neutral"
                  variant="soft"
                  disabled={isFetchingNextNotesPage}
                  onPress={() => fetchNextNotesPage()}
                >
                  {isFetchingNextNotesPage
                    ? t("home.loading")
                    : t("home.loadMore")}
                </Button>
              )}
            </Box>
          )}
        </Box>

        <Divider lineColor="muted" style={{ opacity: 0.35 }} />

        <Box style={{ gap: 8 }}>
          <Typography level="body-md" weight={700}>
            {t("sections.audit")}
          </Typography>
          {!isFetchingActions && actions.length === 0 ? (
            <Typography level="body-sm" textColor="muted">
              {t("user.audit.empty")}
            </Typography>
          ) : (
            <Box style={{ gap: 12 }}>
              {actions.map((entry) => (
                <Box key={entry.id} style={{ gap: 2 }}>
                  <Typography level="body-sm">
                    {entry.actor.globalName || entry.actor.username}{" "}
                    {describeAction(entry.action, t)}
                  </Typography>
                  {entry.reason && (
                    <Typography level="body-sm" textColor="muted">
                      {entry.reason}
                    </Typography>
                  )}
                  <Typography level="body-xs" textColor="muted">
                    {dayjs(entry.createdAt).format("MMM D, YYYY h:mm A")}
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
                    ? t("home.loading")
                    : t("home.loadMore")}
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
