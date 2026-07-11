import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { Screen } from "@components/Screen/Screen";
import { StaffHeader } from "@components/Staff/StaffHeader";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useRequireStaffAccess } from "@hooks/useRequireStaffAccess";
import { useAppStore } from "@hooks/useStores";
import type { APIAppeal, AppealStatus } from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Href } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView } from "react-native";
import dayjs from "dayjs";

const PAGE_LIMIT = 50;
const ANY = "any";
const statusValues = [ANY, "pending", "accepted", "rejected"] as const;

const StaffAppealsScreen = () => {
  const { t } = useTranslation("staff");
  const { isStaff } = useRequireStaffAccess();
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("pending");
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>(
    {},
  );

  const effectiveStatus = status === ANY ? undefined : (status as AppealStatus);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["staff", "appeals", effectiveStatus],
      enabled: isStaff,
      initialPageParam: undefined as string | undefined,
      queryFn: ({ pageParam }) => {
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_LIMIT));
        if (effectiveStatus) params.set("status", effectiveStatus);
        if (pageParam) params.set("before", pageParam);
        return app.rest.get<APIAppeal[]>(`staff/appeals?${params.toString()}`);
      },
      getNextPageParam: (lastPage) =>
        lastPage.length === PAGE_LIMIT
          ? lastPage[lastPage.length - 1]?.id
          : undefined,
    });

  const { mutate: reviewAppeal, isPending: reviewing } = useMutation({
    mutationFn: ({
      appealId,
      nextStatus,
      staffResponse,
    }: {
      appealId: string;
      nextStatus: "accepted" | "rejected";
      staffResponse?: string;
    }) =>
      app.rest.patch<APIAppeal, { status: string; staffResponse?: string }>(
        `staff/appeals/${appealId}`,
        {
          status: nextStatus,
          ...(staffResponse?.trim()
            ? { staffResponse: staffResponse.trim() }
            : {}),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["staff", "appeals"] });
    },
  });

  const appeals = data?.pages.flat() ?? [];

  useEffect(() => {
    if (!isStaff) return;
    for (const appeal of appeals) {
      void app.users.resolve(appeal.user.id);
    }
  }, [isStaff, appeals, app.users]);

  if (!isStaff) return null;

  const statusLabel = (value: string) => {
    if (value === ANY) return t("appeals.anyStatus");
    return t(`appeals.status.${value}`);
  };

  return (
    <Screen style={{ flexDirection: "column", gap: 12, paddingBottom: 16 }}>
      <StaffHeader title={t("nav.appeals")} showBack backHref="/staff" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
      >
        {statusValues.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={status === value ? "solid" : "soft"}
            color={status === value ? "primary" : "neutral"}
            onPress={() => setStatus(value)}
          >
            {statusLabel(value)}
          </Button>
        ))}
      </ScrollView>

      {isLoading && (
        <Box style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator />
        </Box>
      )}

      {!isLoading && appeals.length === 0 && (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ paddingHorizontal: 12 }}
        >
          {t("appeals.empty")}
        </Typography>
      )}

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 12,
          gap: 12,
          paddingBottom: 24,
        }}
      >
        {appeals.map((appeal) => (
          <Paper
            key={appeal.id}
            style={{ padding: 12, borderRadius: 12, gap: 10 }}
            elevation={app.settings?.preferEmbossed ? 3 : 0}
          >
            <Box
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <UserAvatar user={app.users.get(appeal.user.id)} size="md" />
              <Box style={{ flex: 1, gap: 2 }}>
                <Typography level="body-md" weight={700}>
                  {appeal.user.globalName ?? appeal.user.username}
                </Typography>
                <Typography level="body-xs" textColor="muted">
                  @{appeal.user.username} · {dayjs(appeal.createdAt).calendar()}
                </Typography>
              </Box>
              <Typography level="body-xs" weight={700}>
                {t(`appeals.status.${appeal.status}`)}
              </Typography>
            </Box>

            <Typography level="body-sm">{appeal.message}</Typography>

            {appeal.staffResponse && (
              <Typography level="body-sm" textColor="muted">
                {t("appeals.staffResponse", { text: appeal.staffResponse })}
              </Typography>
            )}

            {appeal.status === "pending" ? (
              <Box style={{ gap: 8 }}>
                <InputDefault
                  fullWidth
                  multiline
                  placeholder={t("appeals.responsePlaceholder")}
                  value={responseDrafts[appeal.id] ?? ""}
                  onChangeText={(value) =>
                    setResponseDrafts((prev) => ({
                      ...prev,
                      [appeal.id]: value,
                    }))
                  }
                />
                <Box style={{ flexDirection: "row", gap: 8 }}>
                  <Button
                    style={{ flex: 1 }}
                    color="success"
                    disabled={reviewing}
                    onPress={() =>
                      reviewAppeal({
                        appealId: appeal.id,
                        nextStatus: "accepted",
                        staffResponse: responseDrafts[appeal.id],
                      })
                    }
                  >
                    {t("appeals.accept")}
                  </Button>
                  <Button
                    style={{ flex: 1 }}
                    color="danger"
                    disabled={reviewing}
                    onPress={() =>
                      reviewAppeal({
                        appealId: appeal.id,
                        nextStatus: "rejected",
                        staffResponse: responseDrafts[appeal.id],
                      })
                    }
                  >
                    {t("appeals.reject")}
                  </Button>
                  <Button
                    variant="soft"
                    onPress={() =>
                      navigate(`/staff/users/${appeal.user.id}` as Href)
                    }
                  >
                    {t("appeals.viewUser")}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button
                variant="soft"
                onPress={() =>
                  navigate(`/staff/users/${appeal.user.id}` as Href)
                }
              >
                {t("appeals.viewUser")}
              </Button>
            )}
          </Paper>
        ))}

        {hasNextPage && (
          <Button
            variant="soft"
            disabled={isFetchingNextPage}
            onPress={() => void fetchNextPage()}
          >
            {isFetchingNextPage ? t("home.loading") : t("home.loadMore")}
          </Button>
        )}
      </ScrollView>
    </Screen>
  );
};

export default observer(StaffAppealsScreen);
