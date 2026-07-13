import { Button } from "@components/Button";
import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { Paper } from "@components/Paper";
import { Screen } from "@components/Screen/Screen";
import { StaffHeader } from "@components/Staff/StaffHeader";
import { useRequireStaffAccess } from "@hooks/useRequireStaffAccess";
import { useAppStore } from "@hooks/useStores";
import type { APIChangelog } from "@mutualzz/types";
import { Box, Input, Typography } from "@mutualzz/ui-native";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import dayjs from "dayjs";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

const PAGE_LIMIT = 25;

const StaffChangelogsScreen = () => {
  const { t } = useTranslation("staff");
  const { isStaff } = useRequireStaffAccess();
  const app = useAppStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDeveloper = !!app.account?.isDeveloper;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [desktopVersion, setDesktopVersion] = useState("");
  const [mobileVersion, setMobileVersion] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStaff && !isDeveloper) {
      router.replace("/staff" as Href);
    }
  }, [isStaff, isDeveloper, router]);

  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["staff-changelogs"],
    queryFn: ({ pageParam }) =>
      app.rest.get<APIChangelog[]>("/staff/changelogs", {
        ...(pageParam ? { before: pageParam } : {}),
        limit: PAGE_LIMIT,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_LIMIT
        ? lastPage[lastPage.length - 1].id
        : undefined,
    enabled: isStaff && isDeveloper,
  });

  const changelogs = data?.pages.flat() ?? [];

  const publishMutation = useMutation({
    mutationFn: () =>
      app.rest.post<APIChangelog>("/staff/changelogs", {
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || null,
        desktopVersion: desktopVersion.trim() || null,
        mobileVersion: mobileVersion.trim() || null,
      }),
    onSuccess: async () => {
      setTitle("");
      setBody("");
      setImageUrl("");
      setDesktopVersion("");
      setMobileVersion("");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["staff-changelogs"] });
    },
    onError: () => setError(t("changelogs.errors.publish")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => app.rest.delete(`/staff/changelogs/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["staff-changelogs"] });
    },
    onError: () => setError(t("changelogs.errors.delete")),
  });

  if (!isStaff || !isDeveloper) return null;

  const canPublish =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (!!desktopVersion.trim() || !!mobileVersion.trim()) &&
    !publishMutation.isPending;

  return (
    <Screen style={{ flexDirection: "column" }}>
      <StaffHeader
        title={t("pages.changelogs")}
        showBack
        backHref={"/staff" as Href}
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Typography level="body-sm" textColor="muted">
          {t("changelogs.description")}
        </Typography>

        <Box style={{ gap: 10 }}>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder={t("changelogs.titlePlaceholder")}
          />
          <Input
            value={body}
            onChangeText={setBody}
            placeholder={t("changelogs.bodyPlaceholder")}
            multiline
            style={{ minHeight: 120, textAlignVertical: "top" }}
          />
          <Input
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder={t("changelogs.imageUrlPlaceholder")}
            autoCapitalize="none"
          />
          <Typography level="body-xs" textColor="muted">
            {t("changelogs.desktopVersion")}
          </Typography>
          <Input
            value={desktopVersion}
            onChangeText={setDesktopVersion}
            placeholder={t("changelogs.versionPlaceholder")}
            autoCapitalize="none"
          />
          <Typography level="body-xs" textColor="muted">
            {t("changelogs.mobileVersion")}
          </Typography>
          <Input
            value={mobileVersion}
            onChangeText={setMobileVersion}
            placeholder={t("changelogs.versionPlaceholder")}
            autoCapitalize="none"
          />
          {error ? (
            <Typography level="body-sm" color="danger">
              {error}
            </Typography>
          ) : null}
          <Button
            variant="solid"
            color="primary"
            disabled={!canPublish}
            onPress={() => {
              if (!desktopVersion.trim() && !mobileVersion.trim()) {
                setError(t("changelogs.errors.versionRequired"));
                return;
              }
              publishMutation.mutate();
            }}
          >
            {publishMutation.isPending
              ? t("changelogs.publishing")
              : t("changelogs.publish")}
          </Button>
        </Box>

        <Box style={{ gap: 8 }}>
          {changelogs.length === 0 && !isFetching ? (
            <Typography level="body-sm" textColor="muted">
              {t("changelogs.empty")}
            </Typography>
          ) : null}

          {changelogs.map((entry) => (
            <Paper
              key={entry.id}
              variant="plain"
              style={{ padding: 12, borderRadius: 10, gap: 8 }}
            >
              <Box
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <Box style={{ flex: 1, gap: 2 }}>
                  <Typography level="body-sm" weight={700}>
                    {entry.title}
                  </Typography>
                  <Typography level="body-xs" textColor="muted">
                    {dayjs(entry.publishedAt).format("MMM D, YYYY")}
                    {entry.desktopVersion
                      ? ` · ${t("changelogs.desktop", { version: entry.desktopVersion })}`
                      : ""}
                    {entry.mobileVersion
                      ? ` · ${t("changelogs.mobile", { version: entry.mobileVersion })}`
                      : ""}
                  </Typography>
                </Box>
                <Button
                  size="sm"
                  variant="soft"
                  color="danger"
                  disabled={deleteMutation.isPending}
                  onPress={() => deleteMutation.mutate(entry.id)}
                >
                  {t("changelogs.delete")}
                </Button>
              </Box>
              <MarkdownRenderer value={entry.body} />
            </Paper>
          ))}

          {hasNextPage ? (
            <Button
              variant="soft"
              disabled={isFetchingNextPage}
              onPress={() => void fetchNextPage()}
            >
              {isFetchingNextPage ? t("working") : t("home.loadMore")}
            </Button>
          ) : null}
        </Box>
      </ScrollView>
    </Screen>
  );
};

export default observer(StaffChangelogsScreen);
