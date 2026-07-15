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
import { spaceCategoryTitleKeys, spacePageTitleKeys } from "@mutualzz/i18n";
import { Box, Sheet, Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import {
  GearIcon,
  SignOutIcon,
  TrashIcon,
  CheckCircleIcon,
  FlagIcon,
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
