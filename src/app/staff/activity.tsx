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
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";
import dayjs from "dayjs";
import type { TFunction } from "i18next";

const PAGE_LIMIT = 50;

const formatStaffActionTarget = (
  entry: APIStaffAction,
  t: TFunction<"staff">,
) => {
  if (entry.target) {
    return entry.target.globalName || entry.target.username;
  }

  if (entry.action === "user.hard_delete" && entry.reason) {
    const match = entry.reason.match(/^@([^\s(]+)/);
    if (match) return t("activity.removedUserNamed", { name: match[1] });
  }

  return t("activity.removedUser");
};

const describeGlobalAction = (
  entry: APIStaffAction,
  t: TFunction<"staff">,
) => {
  const actor = entry.actor.globalName || entry.actor.username;
  const target = formatStaffActionTarget(entry, t);

  const globalKeys: Record<string, string> = {
    "user.disable": "auditActions.global.disabled",
    "user.enable": "auditActions.global.enabled",
    "user.delete": "auditActions.global.softDeleted",
    "user.hard_delete": "auditActions.global.hardDeleted",
    "user.force_logout": "auditActions.global.forcedLogout",
    "user.session_revoke": "auditActions.global.revokedSession",
    "user.profile_update": "auditActions.global.updatedProfile",
    "user.warn": "auditActions.global.warned",
    "user.restrict": "auditActions.global.restricted",
    "user.restrict_lift": "auditActions.global.liftedRestriction",
  };

  if (globalKeys[entry.action]) {
    return t(globalKeys[entry.action], { actor, target });
  }

  const flagMatch = entry.action.match(/^user\.flag\.(.+)\.(grant|revoke)$/);
  if (flagMatch) {
    const [, flag, verb] = flagMatch;
    return verb === "grant"
      ? t("auditActions.global.grantedFlag", { actor, flag, target })
      : t("auditActions.global.revokedFlag", { actor, flag, target });
  }

  const takedownMatch = entry.action.match(/^content\.takedown\.(.+)$/);
  if (takedownMatch) {
    return t("auditActions.global.tookDownContent", {
      actor,
      type: takedownMatch[1],
    });
  }

  if (entry.action === "space.delete") {
    return t("auditActions.global.shutDownSpace", { actor });
  }

  if (entry.action === "space.lockdown") {
    return t("auditActions.global.lockedDownSpace", { actor });
  }

  if (entry.action === "changelog.publish") {
    return t("auditActions.global.publishedChangelog", { actor });
  }

  if (entry.action === "changelog.delete") {
    return t("auditActions.global.deletedChangelog", { actor });
  }

  return `${actor} performed ${entry.action} on ${target}`;
};

const StaffActivityScreen = () => {
  const { t } = useTranslation("staff");
  const { isStaff } = useRequireStaffAccess();
  const app = useAppStore();
  const { navigate } = useAppNavigation();

  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
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
      enabled: isStaff,
    });

  const actions = data?.pages.flat() ?? [];

  if (!isStaff) return null;

  return (
    <Screen style={{ flexDirection: "column" }}>
      <StaffHeader
        title={t("pages.activity")}
        showBack
        backHref="/staff"
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {isFetching && !isFetchingNextPage && (
          <Typography level="body-sm" textColor="muted">
            {t("home.loading")}
          </Typography>
        )}

        {!isFetching && actions.length === 0 && (
          <Typography level="body-sm" textColor="muted">
            {t("activity.empty")}
          </Typography>
        )}

        {actions.map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => {
              if (!entry.target) return;
              navigate(`/staff/users/${entry.target.id}` as Href);
            }}
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
                  {describeGlobalAction(entry, t)}
                </Typography>
                {entry.reason && (
                  <Typography level="body-xs" textColor="muted">
                    {entry.reason}
                  </Typography>
                )}
                <Typography level="body-xs" textColor="muted">
                  {dayjs(entry.createdAt).format("MMM D, YYYY h:mm A")}
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
            {isFetchingNextPage ? t("home.loading") : t("home.loadMore")}
          </Button>
        )}
      </ScrollView>
    </Screen>
  );
};

export default observer(StaffActivityScreen);
