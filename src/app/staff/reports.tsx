import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { Screen } from "@components/Screen/Screen";
import { StaffHeader } from "@components/Staff/StaffHeader";
import { useRequireStaffAccess } from "@hooks/useRequireStaffAccess";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { APIReport, ReportStatus } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import type { Href } from "expo-router";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ScrollView } from "react-native";
import dayjs from "dayjs";

const PAGE_LIMIT = 50;
const ANY = "any";

const statusOptions = [
    { value: ANY, label: "Any status" },
    { value: "pending", label: "Pending" },
    { value: "reviewed", label: "Reviewed" },
    { value: "dismissed", label: "Dismissed" },
    { value: "actioned", label: "Actioned" },
];

const targetTypeOptions = [
    { value: ANY, label: "Any type" },
    { value: "message", label: "Message" },
    { value: "post", label: "Post" },
    { value: "comment", label: "Comment" },
    { value: "user", label: "User" },
];

const reasonLabels: Record<string, string> = {
    spam: "Spam",
    harassment: "Harassment or Abuse",
    hate_speech: "Hate Speech",
    nsfw: "NSFW / Inappropriate Content",
    self_harm: "Self-Harm or Suicide",
    impersonation: "Impersonation",
    misinformation: "Misinformation",
    other: "Other",
};

const StaffReportsScreen = () => {
    const { isStaff } = useRequireStaffAccess();
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const queryClient = useQueryClient();

    const [status, setStatus] = useState<string>("pending");
    const [targetType, setTargetType] = useState<string>(ANY);

    const effectiveStatus = status === ANY ? undefined : status;
    const effectiveTargetType = targetType === ANY ? undefined : targetType;

    const queryKey = ["staff-reports", effectiveStatus, effectiveTargetType];

    const {
        data,
        isFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) =>
            app.rest.get<APIReport[]>("/staff/reports", {
                ...(effectiveStatus ? { status: effectiveStatus } : {}),
                ...(effectiveTargetType
                    ? { targetType: effectiveTargetType }
                    : {}),
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

    const reports = data?.pages.flat() ?? [];

    const { mutate: updateStatus, isPending: updatingStatus } = useMutation({
        mutationKey: ["staff-update-report-status"],
        mutationFn: ({
            reportId,
            status: newStatus,
        }: {
            reportId: string;
            status: ReportStatus;
        }) =>
            app.rest.patch(`/staff/reports/${reportId}`, {
                status: newStatus,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff-reports"] });
        },
    });

    const { mutate: takedownContent, isPending: takingDown } = useMutation({
        mutationKey: ["staff-report-takedown"],
        mutationFn: (reportId: string) =>
            app.rest.post<{ report: APIReport; contentRemoved: boolean }>(
                `/staff/reports/${reportId}/takedown`,
                {},
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff-reports"] });
        },
    });

    if (!isStaff) return null;

    return (
        <Screen style={{ flexDirection: "column" }}>
            <StaffHeader title="Reports" showBack />
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Box style={{ flexDirection: "row", gap: 8 }}>
                        {statusOptions.map((o) => (
                            <Button
                                key={o.value}
                                size="sm"
                                variant={status === o.value ? "solid" : "soft"}
                                color={status === o.value ? "primary" : "neutral"}
                                onPress={() => setStatus(o.value)}
                            >
                                {o.label}
                            </Button>
                        ))}
                    </Box>
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Box style={{ flexDirection: "row", gap: 8 }}>
                        {targetTypeOptions.map((o) => (
                            <Button
                                key={o.value}
                                size="sm"
                                variant={
                                    targetType === o.value ? "solid" : "soft"
                                }
                                color={
                                    targetType === o.value
                                        ? "primary"
                                        : "neutral"
                                }
                                onPress={() => setTargetType(o.value)}
                            >
                                {o.label}
                            </Button>
                        ))}
                    </Box>
                </ScrollView>

                {isFetching && (
                    <Typography level="body-sm" textColor="muted">
                        Loading...
                    </Typography>
                )}

                {!isFetching && reports.length === 0 && (
                    <Typography level="body-sm" textColor="muted">
                        No reports found
                    </Typography>
                )}

                <Box style={{ gap: 8 }}>
                    {reports.map((report) => (
                        <Paper
                            key={report.id}
                            variant="plain"
                            style={{ padding: 12, borderRadius: 10, gap: 8 }}
                        >
                            <Box
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: 8,
                                }}
                            >
                                <Box style={{ flex: 1, gap: 2 }}>
                                    <Typography level="body-sm" weight={700}>
                                        {reasonLabels[report.reason] ??
                                            report.reason}{" "}
                                        · {report.targetType} {report.targetId}
                                    </Typography>
                                    <Typography
                                        level="body-xs"
                                        textColor="muted"
                                    >
                                        Reported by{" "}
                                        {report.reporter.globalName ||
                                            report.reporter.username}
                                        {" · "}
                                        {dayjs(report.createdAt).format(
                                            "MMM D, YYYY h:mm A",
                                        )}
                                    </Typography>
                                </Box>
                                <Typography
                                    level="body-xs"
                                    weight={700}
                                    textColor="muted"
                                >
                                    {report.status.toUpperCase()}
                                </Typography>
                            </Box>

                            {report.description && (
                                <Typography level="body-sm">
                                    {report.description}
                                </Typography>
                            )}

                            {report.targetType === "user" && (
                                <Button
                                    size="sm"
                                    color="neutral"
                                    variant="soft"
                                    onPress={() =>
                                        navigate(
                                            `/staff/users/${report.targetId}` as Href,
                                        )
                                    }
                                >
                                    View Account
                                </Button>
                            )}

                            {report.status === "pending" && (
                                <Box
                                    style={{
                                        flexDirection: "row",
                                        flexWrap: "wrap",
                                        gap: 8,
                                    }}
                                >
                                    {report.targetType !== "user" && (
                                        <Button
                                            size="sm"
                                            color="danger"
                                            variant="solid"
                                            disabled={
                                                takingDown || updatingStatus
                                            }
                                            onPress={() =>
                                                takedownContent(report.id)
                                            }
                                        >
                                            {takingDown
                                                ? "Removing..."
                                                : "Take Down"}
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        color="success"
                                        variant="soft"
                                        disabled={updatingStatus || takingDown}
                                        onPress={() =>
                                            updateStatus({
                                                reportId: report.id,
                                                status: "reviewed",
                                            })
                                        }
                                    >
                                        Reviewed
                                    </Button>
                                    <Button
                                        size="sm"
                                        color="danger"
                                        variant="soft"
                                        disabled={updatingStatus || takingDown}
                                        onPress={() =>
                                            updateStatus({
                                                reportId: report.id,
                                                status: "actioned",
                                            })
                                        }
                                    >
                                        Actioned
                                    </Button>
                                    <Button
                                        size="sm"
                                        color="neutral"
                                        variant="soft"
                                        disabled={updatingStatus || takingDown}
                                        onPress={() =>
                                            updateStatus({
                                                reportId: report.id,
                                                status: "dismissed",
                                            })
                                        }
                                    >
                                        Dismiss
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    ))}
                </Box>

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

export default observer(StaffReportsScreen);
