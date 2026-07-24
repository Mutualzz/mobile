import { CategoryCreateSheet } from "@components/Channel/CategoryCreateSheet";
import { ChannelCreateSheet } from "@components/Channel/ChannelCreateSheet";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { SpaceActionConfirmSheet } from "@components/SpaceSettings/SpaceActionConfirmSheet";
import { SpaceInviteToSpaceSheet } from "@components/Space/SpaceInviteToSpaceSheet";
import {
  SpaceSheetHeader,
  SpaceSheetMenuGroupRows,
  SpaceSheetQuickActions,
  type SpaceSheetMenuItem,
  type SpaceSheetQuickAction,
} from "@components/Space/sheet/components";
import {
  spaceSettingsHref,
} from "./SpaceSettingsNavContent";
import { useOpenSpaceNotificationSettingsSheet } from "./SpaceNotificationSettingsSheet";
import { useOpenSpaceSettingsSheet } from "./SpaceSettingsSheet";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { useSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { ChannelType, ExpressionType } from "@mutualzz/types";
import { Paper } from "@components/Paper";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Channel } from "@stores/objects/Channel";
import type { Space } from "@stores/objects/Space";
import { useExpressionThumbnailStyle } from "@utils/accessibilityLayout";
import {
  BellIcon,
  CheckCircleIcon,
  FlagIcon,
  FolderPlusIcon,
  GearSixIcon,
  HashIcon,
  PaperPlaneTiltIcon,
  SignOutIcon,
  TreeStructureIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, View } from "react-native";

const MAIN_SHEET_PROPS = {
  snapPoints: ["90%"],
  enableDynamicSizing: false,
  showHandle: true,
  showCloseButton: false,
};

interface SpaceActionSheetProps {
  space: Space;
  sheetId: string;
  channel?: Channel | null;
}

export const SpaceActionSheet = observer(
  ({ space, sheetId, channel }: SpaceActionSheetProps) => {
    const { t } = useTranslation("space");
    const { t: tChat } = useTranslation("chat");
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const { closeSheet, openSheet } = useSheet();
    const openNotificationSettings = useOpenSpaceNotificationSettingsSheet();
    const openSpaceSettings = useOpenSpaceSettingsSheet();
    const emojiThumbnailStyle = useExpressionThumbnailStyle();
    const [createChannelOpen, setCreateChannelOpen] = useState(false);
    const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

    const me = space.members.me;
    const { canManage } = useSpaceSettingsAccess(space);
    const isOwner = space.ownerId === app.account?.id;
    const hasUnread = space.hasUnread();
    const canManageChannels = me?.hasPermission("ManageChannels") ?? false;
    const canViewRoles =
      me?.hasAnyPermission(["ManageRoles", "ManageSpace"]) ?? false;
    const canViewExpressions =
      me?.hasAnyPermission(["ManageExpressions", "CreateExpressions"]) ??
      false;

    const canInvite = space.visibleChannels.some(
      (ch) =>
        ch.type !== ChannelType.Category &&
        (me?.hasPermission("CreateInvites", ch) ?? false),
    );

    const inviteChannel =
      channel ??
      space.visibleChannels.find(
        (ch) =>
          ch.type !== ChannelType.Category &&
          (me?.hasPermission("CreateInvites", ch) ?? false),
      );

    const spaceEmojis = useMemo(
      () =>
        [...space.expressions.values()].filter(
          (expression) => expression.type === ExpressionType.Emoji,
        ),
      [space.expressions],
    );

    useEffect(() => {
      const listChannel =
        channel ??
        space.visibleChannels.find((ch) => ch.type !== ChannelType.Category);
      if (!listChannel) return;
      app.gateway.requestMemberListRange(space.id, listChannel.id, 100);
    }, [app.gateway, channel, space]);

    const close = () => closeSheet(sheetId);

    const markAsRead = () => {
      void space.markAsRead();
      close();
    };

    const openInvite = () => {
      close();
      openSheet(
        `space-invite-${space.id}`,
        <SpaceInviteToSpaceSheet space={space} channel={inviteChannel} />,
      );
    };

    const openReport = () => {
      const reportSheetId = `report-space-${space.id}`;
      close();
      openSheet(
        reportSheetId,
        <ReportContentSheet
          targetType="space"
          targetId={space.id}
          contentLabel={tChat("contextMenu.reportSpaceLabel")}
          sheetId={reportSheetId}
        />,
      );
    };

    const confirmLeave = () => {
      const leaveSheetId = `leave-space-confirm-${space.id}`;
      close();
      openSheet(
        leaveSheetId,
        <SpaceActionConfirmSheet
          space={space}
          action="leave"
          sheetId={leaveSheetId}
        />,
      );
    };

    const navigateToSettingsPage = (
      page: "channels" | "roles" | "expressions",
    ) => {
      close();
      navigate(spaceSettingsHref(space.id, page));
    };

    const quickActions = useMemo(() => {
      const actions: SpaceSheetQuickAction[] = [];

      if (canInvite) {
        actions.push({
          key: "invite",
          label: t("sheet.quickActions.invite"),
          Icon: PaperPlaneTiltIcon,
          onPress: openInvite,
        });
      }

      actions.push({
        key: "notifications",
        label: t("sheet.quickActions.notifications"),
        Icon: BellIcon,
        onPress: () => openNotificationSettings(space),
      });

      if (canManage) {
        actions.push({
          key: "settings",
          label: t("sheet.quickActions.settings"),
          Icon: GearSixIcon,
          onPress: () => openSpaceSettings(space),
        });
      }

      return actions;
    }, [
      canInvite,
      canManage,
      openInvite,
      openNotificationSettings,
      openSpaceSettings,
      space,
      t,
    ]);

    const generalRows: SpaceSheetMenuItem[] = [
      {
        key: "mark-read",
        label: tChat("contextMenu.markAsRead"),
        Icon: CheckCircleIcon,
        disabled: !hasUnread,
        onPress: markAsRead,
      },
      ...(canManageChannels
        ? [
            {
              key: "channels",
              label: t("nav.pages.channels"),
              Icon: HashIcon,
              onPress: () => navigateToSettingsPage("channels"),
            },
          ]
        : []),
      ...(canViewRoles
        ? [
            {
              key: "roles",
              label: t("nav.pages.roles"),
              Icon: TreeStructureIcon,
              onPress: () => navigateToSettingsPage("roles"),
            },
          ]
        : []),
    ];

    const adminRows: SpaceSheetMenuItem[] = canManageChannels
      ? [
          {
            key: "create-channel",
            label: tChat("contextMenu.createChannel"),
            Icon: HashIcon,
            onPress: () => setCreateChannelOpen(true),
          },
          {
            key: "create-category",
            label: tChat("contextMenu.createCategory"),
            Icon: FolderPlusIcon,
            onPress: () => setCreateCategoryOpen(true),
          },
        ]
      : [];

    const moderationRows: SpaceSheetMenuItem[] = !isOwner
      ? [
          {
            key: "report",
            label: tChat("contextMenu.reportSpace"),
            Icon: FlagIcon,
            danger: true,
            onPress: openReport,
          },
        ]
      : [];

    const dangerRows: SpaceSheetMenuItem[] = !isOwner
      ? [
          {
            key: "leave",
            label: tChat("contextMenu.leaveSpace"),
            Icon: SignOutIcon,
            danger: true,
            onPress: confirmLeave,
          },
        ]
      : [];

    return (
      <>
        <View style={{ flex: 1, width: "100%" }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 4,
              paddingBottom: 32,
              gap: 16,
            }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <SpaceSheetHeader space={space} />
            <SpaceSheetQuickActions actions={quickActions} />

            <SpaceSheetMenuGroupRows rows={generalRows} />

            {adminRows.length > 0 ? (
              <SpaceSheetMenuGroupRows rows={adminRows} />
            ) : null}

            {moderationRows.length > 0 ? (
              <SpaceSheetMenuGroupRows rows={moderationRows} />
            ) : null}

            {dangerRows.length > 0 ? (
              <SpaceSheetMenuGroupRows rows={dangerRows} />
            ) : null}

            {spaceEmojis.length > 0 && canViewExpressions ? (
              <Box style={{ gap: 8 }}>
                <Typography
                  level="body-xs"
                  textColor="muted"
                  style={{ paddingHorizontal: 4, textTransform: "uppercase" }}
                >
                  {t("sheet.spaceEmojis")}
                </Typography>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("sheet.spaceEmojis")}
                  onPress={() => navigateToSettingsPage("expressions")}
                >
                  <Paper style={{ borderRadius: 12, padding: 12 }}>
                    <Box
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      {spaceEmojis.slice(0, 12).map((emoji) => (
                        <Image
                          key={emoji.id}
                          source={{ uri: emoji.url }}
                          style={emojiThumbnailStyle}
                        />
                      ))}
                    </Box>
                  </Paper>
                </Pressable>
              </Box>
            ) : null}
          </ScrollView>
        </View>

        <ChannelCreateSheet
          visible={createChannelOpen}
          onClose={() => setCreateChannelOpen(false)}
          space={space}
        />

        <CategoryCreateSheet
          visible={createCategoryOpen}
          onClose={() => setCreateCategoryOpen(false)}
          space={space}
        />
      </>
    );
  },
);

export function useOpenSpaceActionSheet() {
  const { openSheet } = useSheet();

  return useCallback(
    (space: Space, options?: { channel?: Channel | null }) => {
      const sheetId = `space-action-${space.id}`;
      openSheet(
        sheetId,
        <SpaceActionSheet
          space={space}
          sheetId={sheetId}
          channel={options?.channel}
        />,
        MAIN_SHEET_PROPS,
      );
    },
    [openSheet],
  );
}
