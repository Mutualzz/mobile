import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { Screen } from "@components/Screen/Screen";
import { StaffHeader } from "@components/Staff/StaffHeader";
import { useRequireStaffAccess } from "@hooks/useRequireStaffAccess";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { APIReportContent, APIReportDetail, ReportStatus } from "@mutualzz/types";
import { Box, Typography } from "@mutualzz/ui-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";
import { ScrollView } from "react-native";
import dayjs from "dayjs";

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

function getTakedownLabel(targetType: string) {
    return targetType === "space" ? "Shut Down Space" : "Take Down";
}

function ReportContentPreview({
    content,
    reportedMessageId,
}: {
    content: APIReportContent;
    reportedMessageId?: string;
}) {
    if (content.type === "unavailable") {
        return (
            <Typography level="body-sm" textColor="muted">
                {content.message}
            </Typography>
        );
    }

    if (content.type === "message") {
        return (
            <Box style={{ gap: 8 }}>
                <Typography level="body-xs" textColor="muted">
                    {content.data.isDirectMessage
                        ? "Direct message context"
                        : "Message context"}
                </Typography>
                {content.data.context.map((message) => {
                    const isReported = message.id === reportedMessageId;
                    const authorName =
                        message.author?.globalName ||
                        message.author?.username ||
                        "Unknown";

                    return (
                        <Paper
                            key={message.id}
                            variant="plain"
                            style={{
                                padding: 10,
                                borderRadius: 8,
                                gap: 4,
                                borderWidth: isReported ? 1 : 0,
                                borderColor: isReported ? "#e5484d" : undefined,
                            }}
                        >
                            <Typography level="body-xs" weight={700}>
                                {authorName}
                                {isReported ? " · REPORTED" : ""}
                            </Typography>
                            <Typography level="body-sm">
                                {message.content?.trim() || "(no text content)"}
                            </Typography>
                        </Paper>
                    );
                })}
            </Box>
        );
    }

    if (content.type === "post") {
        const { post } = content.data;
        return (
            <Typography level="body-sm">
                {post.content?.trim() || "(no text content)"}
            </Typography>
        );
    }

    if (content.type === "comment") {
        const { comment } = content.data;
        return (
            <Typography level="body-sm">
                {comment.content?.trim() || "(no text content)"}
            </Typography>
        );
    }

    if (content.type === "user") {
        const { user } = content.data;
        return (
            <Typography level="body-sm" weight={700}>
                {user.globalName || user.username} (@{user.username})
            </Typography>
        );
    }

    if (content.type === "space") {
        const { space } = content.data;
        const ownerName =
            space.owner?.globalName || space.owner?.username || "Unknown";

        return (
            <Box style={{ gap: 4 }}>
                <Typography level="body-sm" weight={700}>
                    {space.name}
                </Typography>
                <Typography level="body-xs" textColor="muted">
                    {space.memberCount} members · owned by {ownerName}
                </Typography>
                {space.description ? (
                    <Typography level="body-sm">{space.description}</Typography>
                ) : null}
            </Box>
        );
    }

    return null;
}

const StaffReportDetailScreen = () => {
    const { isStaff } = useRequireStaffAccess();
    const { reportId } = useLocalSearchParams<{ reportId: string }>();
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const queryClient = useQueryClient();

    const queryKey = ["staff-report", reportId];

    const { data: report, isLoading, error } = useQuery({
        queryKey,
        queryFn: () =>
            app.rest.get<APIReportDetail>(`/staff/reports/${reportId}`),
        enabled: isStaff && !!reportId,
    });

    const { mutate: updateStatus, isPending: updatingStatus } = useMutation({
        mutationKey: ["staff-update-report-status", reportId],
        mutationFn: (status: ReportStatus) =>
            app.rest.patch(`/staff/reports/${reportId}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ["staff-reports"] });
        },
    });

    const { mutate: takedownContent, isPending: takingDown } = useMutation({
        mutationKey: ["staff-report-takedown", reportId],
        mutationFn: () =>
            app.rest.post<{ report: APIReportDetail; contentRemoved: boolean }>(
                `/staff/reports/${reportId}/takedown`,
                {},
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ["staff-reports"] });
        },
    });

    if (!isStaff) return null;

    return (
        <Screen style={{ flexDirection: "column" }}>
            <StaffHeader
                title="Report Details"
                showBack
                backHref="/staff/reports"
            />
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                {isLoading && (
                    <Typography level="body-sm" textColor="muted">
                        Loading report...
                    </Typography>
                )}

                {error && (
                    <Typography level="body-sm" color="danger">
                        Failed to load report
                    </Typography>
                )}

                {report && (
                    <Paper
                        variant="plain"
                        style={{ padding: 14, borderRadius: 12, gap: 12 }}
                    >
                        <Box style={{ gap: 4 }}>
                            <Typography level="body-md" weight={700}>
                                {reasonLabels[report.reason] ?? report.reason}
                            </Typography>
                            <Typography level="body-xs" textColor="muted">
                                {report.targetType} · {report.targetId}
                            </Typography>
                            <Typography level="body-xs" textColor="muted">
                                Reported by{" "}
                                {report.reporter.globalName ||
                                    report.reporter.username}{" "}
                                ·{" "}
                                {dayjs(report.createdAt).format(
                                    "MMM D, YYYY h:mm A",
                                )}
                            </Typography>
                            <Typography level="body-xs" textColor="muted">
                                Status: {report.status}
                            </Typography>
                        </Box>

                        {report.description ? (
                            <Box style={{ gap: 4 }}>
                                <Typography level="body-xs" weight={700}>
                                    Reporter notes
                                </Typography>
                                <Typography level="body-sm">
                                    {report.description}
                                </Typography>
                            </Box>
                        ) : null}

                        <Box style={{ gap: 6 }}>
                            <Typography level="body-sm" weight={700}>
                                Reported content
                            </Typography>
                            <ReportContentPreview
                                content={report.content}
                                reportedMessageId={
                                    report.targetType === "message"
                                        ? report.targetId
                                        : undefined
                                }
                            />
                        </Box>

                        {report.targetType === "user" && (
                            <Button
                                size="sm"
                                color="neutral"
                                variant="soft"
                                onPress={() =>
                                    navigate(`/staff/users/${report.targetId}`)
                                }
                            >
                                Open staff user panel
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
                                        disabled={takingDown || updatingStatus}
                                        onPress={() => takedownContent()}
                                    >
                                        {takingDown
                                            ? "Working..."
                                            : getTakedownLabel(
                                                  report.targetType,
                                              )}
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    color="success"
                                    variant="soft"
                                    disabled={updatingStatus || takingDown}
                                    onPress={() => updateStatus("reviewed")}
                                >
                                    Reviewed
                                </Button>
                                <Button
                                    size="sm"
                                    color="danger"
                                    variant="soft"
                                    disabled={updatingStatus || takingDown}
                                    onPress={() => updateStatus("actioned")}
                                >
                                    Actioned
                                </Button>
                                <Button
                                    size="sm"
                                    color="neutral"
                                    variant="soft"
                                    disabled={updatingStatus || takingDown}
                                    onPress={() => updateStatus("dismissed")}
                                >
                                    Dismiss
                                </Button>
                            </Box>
                        )}
                    </Paper>
                )}
            </ScrollView>
        </Screen>
    );
};

export default observer(StaffReportDetailScreen);
