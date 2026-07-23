import { Button } from "@components/Button";
import { SpaceActionConfirmSheet } from "@components/SpaceSettings/SpaceActionConfirmSheet";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import {
  getVisibleSpaceSettingsPages,
  type SpaceSettingsPage,
} from "@components/SpaceSettings/spaceSettingsPages";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { useSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { NotificationLevel } from "@mutualzz/types";
import { spaceCategoryTitleKeys, spacePageTitleKeys } from "@mutualzz/i18n";
import { Box, Sheet, Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import {
  GearIcon,
  SignOutIcon,
  TrashIcon,
  CheckCircleIcon,
  FlagIcon,
  BellSlashIcon,
} from "phosphor-react-native";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { observer } from "mobx-react-lite";
import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  space: Space;
  visible: boolean;
  onClose: () => void;
}

export const SpaceMenuSheet = observer(({ space, visible, onClose }: Props) => {
  const { t } = useTranslation("space");
  const { t: tChat } = useTranslation("chat");
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const { openSheet } = useSheet();
  const navIconColor = useSettingsIconColor("info");
  const dangerIconColor = useSettingsIconColor("danger");

  const me = space.members.me;
  const categories = me ? getVisibleSpaceSettingsPages(me) : [];
  const { canManage } = useSpaceSettingsAccess(space);
  const isOwner = space.ownerId === app.account?.id;
  const hasUnread = space.hasUnread();
  const spaceSettings = app.spaceNotifications.get(space.id);

  const patchSpaceNotifications = (
    body: Parameters<typeof app.spaceNotifications.patch>[1],
  ) => {
    void app.spaceNotifications.patch(space.id, body);
    onClose();
  };

  const pageLabel = (label: SpaceSettingsPage) => {
    const key = spacePageTitleKeys[label];
    return t(key);
  };

  const markAllRead = () => {
    void space.markAsRead();
    onClose();
  };

  const openSettings = (page?: SpaceSettingsPage) => {
    onClose();
    navigate(
      page
        ? `/(tabs)/spaces/${space.id}/settings/${page}`
        : `/(tabs)/spaces/${space.id}/settings`,
    );
  };

  const confirmReport = () => {
    onClose();
    openSheet(
      `report-space-${space.id}`,
      <ReportContentSheet
        targetType="space"
        targetId={space.id}
        contentLabel={t("contextMenu.reportSpaceLabel", { ns: "chat" })}
        sheetId={`report-space-${space.id}`}
      />,
    );
  };

  const confirmLeave = () => {
    onClose();
    openSheet(
      "leave-space-confirm",
      <SpaceActionConfirmSheet
        space={space}
        action="leave"
        sheetId="leave-space-confirm"
      />,
    );
  };

  const confirmDelete = () => {
    onClose();
    openSheet(
      "delete-space-confirm",
      <SpaceActionConfirmSheet
        space={space}
        action="delete"
        sheetId="delete-space-confirm"
      />,
    );
  };

  return (
    <Sheet
      open={visible}
      onClose={onClose}
      showCloseButton={false}
      enableDynamicSizing
    >
      <View style={{ width: "100%", padding: 16, gap: 12 }}>
        <Typography level="body-lg" weight="bold">
          {space.name}
        </Typography>

        <ScrollView
          contentContainerStyle={{ gap: 8 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          style={{ maxHeight: 420 }}
        >
          {hasUnread && (
            <Button
              variant="soft"
              horizontalAlign="left"
              startDecorator={
                <CheckCircleIcon size={20} weight="fill" color={navIconColor} />
              }
              fullWidth
              onPress={markAllRead}
            >
              {t("actions.markAllAsRead")}
            </Button>
          )}

          <Typography level="body-xs" textColor="muted">
            {tChat("contextMenu.notificationLevel")}
          </Typography>
          <Button
            variant="plain"
            horizontalAlign="left"
            fullWidth
            onPress={() => patchSpaceNotifications({ level: NotificationLevel.All })}
          >
            {tChat("contextMenu.notificationAll")}
          </Button>
          <Button
            variant="plain"
            horizontalAlign="left"
            fullWidth
            onPress={() =>
              patchSpaceNotifications({ level: NotificationLevel.Mentions })
            }
          >
            {tChat("contextMenu.notificationMentions")}
          </Button>
          <Button
            variant="plain"
            horizontalAlign="left"
            fullWidth
            onPress={() =>
              patchSpaceNotifications({ level: NotificationLevel.Nothing })
            }
          >
            {tChat("contextMenu.notificationNothing")}
          </Button>

          <Typography level="body-xs" textColor="muted">
            {tChat("contextMenu.muteSpace")}
          </Typography>
          <Button
            variant="plain"
            horizontalAlign="left"
            startDecorator={<BellSlashIcon size={20} weight="fill" />}
            fullWidth
            onPress={() => patchSpaceNotifications({ muteDuration: "1h" })}
          >
            {tChat("contextMenu.muteDuration1h")}
          </Button>
          <Button
            variant="plain"
            horizontalAlign="left"
            fullWidth
            onPress={() => patchSpaceNotifications({ muteDuration: "8h" })}
          >
            {tChat("contextMenu.muteDuration8h")}
          </Button>
          <Button
            variant="plain"
            horizontalAlign="left"
            fullWidth
            onPress={() => patchSpaceNotifications({ muteDuration: "24h" })}
          >
            {tChat("contextMenu.muteDuration24h")}
          </Button>
          <Button
            variant="plain"
            horizontalAlign="left"
            fullWidth
            onPress={() => patchSpaceNotifications({ muteDuration: "1w" })}
          >
            {tChat("contextMenu.muteDuration1w")}
          </Button>
          <Button
            variant="plain"
            horizontalAlign="left"
            fullWidth
            onPress={() => patchSpaceNotifications({ muteDuration: "forever" })}
          >
            {tChat("contextMenu.muteUntilTurnBackOn")}
          </Button>
          <Button
            variant="plain"
            horizontalAlign="left"
            fullWidth
            onPress={() => patchSpaceNotifications({ muteDuration: "off" })}
          >
            {tChat("contextMenu.unmuteSpace")}
          </Button>
          <Button
            variant="plain"
            horizontalAlign="left"
            fullWidth
            onPress={() =>
              patchSpaceNotifications({
                suppressEveryone: !(spaceSettings?.suppressEveryone ?? false),
              })
            }
          >
            {tChat("contextMenu.suppressEveryone")}
          </Button>
          <Button
            variant="plain"
            horizontalAlign="left"
            fullWidth
            onPress={() =>
              patchSpaceNotifications({
                suppressRoles: !(spaceSettings?.suppressRoles ?? false),
              })
            }
          >
            {tChat("contextMenu.suppressRoles")}
          </Button>

          {canManage && (
            <Button
              variant="soft"
              horizontalAlign="left"
              startDecorator={
                <GearIcon size={20} weight="fill" color={navIconColor} />
              }
              fullWidth
              onPress={() => openSettings()}
            >
              {t("menu.spaceSettings")}
            </Button>
          )}

          {categories.map(({ category, pages }) => (
            <Box key={category} style={{ gap: 6 }}>
              <Typography level="body-xs" textColor="muted">
                {t(spaceCategoryTitleKeys[category])}
              </Typography>
              {pages.map((page) => (
                <Button
                  fullWidth
                  key={page.label}
                  variant="plain"
                  horizontalAlign="left"
                  startDecorator={
                    <page.Icon size={20} weight="fill" color={navIconColor} />
                  }
                  onPress={() => openSettings(page.label)}
                >
                  {pageLabel(page.label)}
                </Button>
              ))}
            </Box>
          ))}

          {!isOwner ? (
            <>
              <Button
                variant="plain"
                color="danger"
                horizontalAlign="left"
                startDecorator={
                  <FlagIcon size={20} weight="fill" color={dangerIconColor} />
                }
                fullWidth
                onPress={confirmReport}
              >
                {t("menu.reportSpace")}
              </Button>
              <Button
                variant="plain"
                color="danger"
                horizontalAlign="left"
                startDecorator={
                  <SignOutIcon
                    size={20}
                    weight="fill"
                    color={dangerIconColor}
                  />
                }
                fullWidth
                onPress={confirmLeave}
              >
                {t("menu.leaveSpace")}
              </Button>
            </>
          ) : (
            <Button
              variant="plain"
              color="danger"
              horizontalAlign="left"
              fullWidth
              startDecorator={
                <TrashIcon size={20} weight="fill" color={dangerIconColor} />
              }
              onPress={confirmDelete}
            >
              {t("menu.deleteSpace")}
            </Button>
          )}
        </ScrollView>
      </View>
    </Sheet>
  );
});
