import {
  useOpenSpaceActionSheet,
  useOpenSpaceNotificationSettingsSheet,
} from "@components/Space/sheet";
import type { Space } from "@stores/objects/Space";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useSpaceQuickActions(space: Space) {
  const { t } = useTranslation("space");
  const { t: tChat } = useTranslation("chat");
  const openSpaceActionSheet = useOpenSpaceActionSheet();
  const openNotificationSettings = useOpenSpaceNotificationSettingsSheet();
  const hasUnread = space.hasUnread();

  const markAsRead = useCallback(() => {
    if (!hasUnread) return;
    void space.markAsRead();
  }, [hasUnread, space]);

  const openNotifications = useCallback(() => {
    openNotificationSettings(space);
  }, [openNotificationSettings, space]);

  const openMoreOptions = useCallback(() => {
    openSpaceActionSheet(space);
  }, [openSpaceActionSheet, space]);

  return {
    hasUnread,
    markAsReadLabel: tChat("contextMenu.markAsRead"),
    notificationsLabel: tChat("contextMenu.notificationSettings"),
    moreOptionsLabel: t("sidebar.moreOptions"),
    markAsRead,
    openNotifications,
    openMoreOptions,
  };
}
