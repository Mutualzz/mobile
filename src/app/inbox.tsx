import {
  CountBadge,
  getMentionedSpaceChannels,
  getUnreadDirectChannels,
  type InboxTab,
} from "@components/Inbox/InboxParts";
import {
  BookmarksTab,
  ForYouTab,
  MentionsTab,
  RemindersTab,
  ScheduledTab,
  UnreadsTab,
} from "@components/Inbox/InboxTabs";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";
import { ArrowLeftIcon, TrayIcon } from "phosphor-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";

const InboxScreen = () => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { back } = useAppNavigation();
  const { t } = useTranslation("common");
  const { tab: requestedTab } = useLocalSearchParams<{ tab?: InboxTab }>();
  const [tab, setTab] = useState<InboxTab>(requestedTab ?? "forYou");

  const tabs: { key: InboxTab; label: string; count: number }[] = [
    {
      key: "forYou",
      label: t("notifications.forYou"),
      count:
        app.relationships.getIncoming().length + app.notifications.unreadCount,
    },
    {
      key: "unreads",
      label: t("notifications.unreads"),
      count:
        getUnreadDirectChannels(app).length +
        getMentionedSpaceChannels(app).length,
    },
    { key: "mentions", label: t("notifications.mentions"), count: 0 },
    { key: "bookmarks", label: t("notifications.bookmarks"), count: 0 },
    {
      key: "reminders",
      label: t("notifications.reminders"),
      count: app.reminders.dueCount,
    },
    {
      key: "scheduled",
      label: t("notifications.scheduled"),
      count: app.scheduledMessages.failedCount,
    },
  ];

  return (
    <Screen
      style={{
        flexDirection: "column",
        borderTopWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
      }}
    >
      <ScreenHeader
        style={{
          paddingHorizontal: 12,
          gap: 10,
          borderTopWidth: 0,
          borderBottomWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
        }}
      >
        <Pressable hitSlop={8} onPress={() => back()}>
          <ArrowLeftIcon
            size={22}
            weight="bold"
            color={theme.typography.colors.primary}
          />
        </Pressable>
        <TrayIcon
          size={22}
          weight="fill"
          color={theme.typography.colors.primary}
        />
        <Typography level="body-lg" weight="bold" style={{ flex: 1 }}>
          {t("notifications.inbox")}
        </Typography>
      </ScreenHeader>

      <Box style={{ flexGrow: 0 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {tabs.map((entry) => {
            const isActive = tab === entry.key;
            return (
              <Pressable
                key={entry.key}
                onPress={() => setTab(entry.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderBottomWidth: 2,
                  borderBottomColor: isActive
                    ? theme.colors.primary
                    : "transparent",
                }}
              >
                <Typography
                  level="body-sm"
                  weight={isActive ? "bold" : "normal"}
                  textColor={isActive ? undefined : "muted"}
                  style={isActive ? { color: theme.colors.primary } : undefined}
                >
                  {entry.label}
                </Typography>
                <CountBadge count={entry.count} />
              </Pressable>
            );
          })}
        </ScrollView>
      </Box>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
      >
        {tab === "forYou" && <ForYouTab onSelectTab={setTab} />}
        {tab === "unreads" && <UnreadsTab />}
        {tab === "mentions" && <MentionsTab />}
        {tab === "bookmarks" && <BookmarksTab />}
        {tab === "reminders" && <RemindersTab />}
        {tab === "scheduled" && <ScheduledTab />}
      </ScrollView>
    </Screen>
  );
};

export default observer(InboxScreen);
