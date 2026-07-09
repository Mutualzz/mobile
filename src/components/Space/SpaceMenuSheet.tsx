import { Paper } from "@components/Paper";
import { Button } from "@components/Button";
import { SpaceActionConfirmSheet } from "@components/SpaceSettings/SpaceActionConfirmSheet";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import {
  getVisibleSpaceSettingsPages,
  type SpaceSettingsPage,
} from "@components/SpaceSettings/spaceSettingsPages";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { useSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { Box, Modal, Typography } from "@mutualzz/ui-native";
import type { Href } from "expo-router";
import type { Space } from "@stores/objects/Space";
import { GearIcon, SignOutIcon, TrashIcon, CheckCircleIcon } from "phosphor-react-native";
import startCase from "lodash-es/startCase";
import { observer } from "mobx-react-lite";
import { ScrollView, View } from "react-native";

interface Props {
  space: Space;
  visible: boolean;
  onClose: () => void;
}

export const SpaceMenuSheet = observer(({ space, visible, onClose }: Props) => {
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const { openModal } = useModal();
  const navIconColor = useSettingsIconColor("info");
  const dangerIconColor = useSettingsIconColor("danger");

  const me = space.members.me;
  const categories = me ? getVisibleSpaceSettingsPages(me) : [];
  const { canManage } = useSpaceSettingsAccess(space);
  const isOwner = space.ownerId === app.account?.id;
  const hasUnread = space.hasUnread();

  const markAllRead = () => {
    void space.markAsRead();
    onClose();
  };

  const openSettings = (page?: SpaceSettingsPage) => {
    onClose();
    navigate(
      (page
        ? `/(tabs)/spaces/${space.id}/settings/${page}`
        : `/(tabs)/spaces/${space.id}/settings`) as Href,
    );
  };

  const confirmLeave = () => {
    onClose();
    openModal(
      "leave-space-confirm",
      <SpaceActionConfirmSheet
        space={space}
        action="leave"
        modalId="leave-space-confirm"
      />,
    );
  };

  const confirmDelete = () => {
    onClose();
    openModal(
      "delete-space-confirm",
      <SpaceActionConfirmSheet
        space={space}
        action="delete"
        modalId="delete-space-confirm"
      />,
    );
  };

  return (
    <Modal
      open={visible}
      onClose={onClose}
      layout="fullscreen"
      showCloseButton={false}
      style={{
        justifyContent: "flex-end",
        alignItems: "stretch",
        backgroundColor: "transparent",
        paddingVertical: 0,
      }}
    >
      <View
        pointerEvents="box-none"
        style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}
      >
        <Paper
          variant="elevation"
          elevation={app.settings?.preferEmbossed ? 4 : 2}
          style={{
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
            gap: 12,
            maxHeight: "70%",
          }}
        >
          <Typography level="body-lg" weight="bold">
            {space.name}
          </Typography>

          <ScrollView
            contentContainerStyle={{ gap: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {hasUnread ? (
              <Button
                variant="soft"
                horizontalAlign="left"
                startDecorator={
                  <CheckCircleIcon
                    size={20}
                    weight="fill"
                    color={navIconColor}
                  />
                }
                fullWidth
                onPress={markAllRead}
              >
                Mark all as read
              </Button>
            ) : null}

            {canManage ? (
              <Button
                variant="soft"
                horizontalAlign="left"
                startDecorator={
                  <GearIcon size={20} weight="fill" color={navIconColor} />
                }
                fullWidth
                onPress={() => openSettings()}
              >
                Space settings
              </Button>
            ) : null}

            {categories.map(({ category, pages }) => (
              <Box key={category} style={{ gap: 6 }}>
                <Typography level="body-xs" textColor="muted">
                  {startCase(category)}
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
                    {startCase(page.label)}
                  </Button>
                ))}
              </Box>
            ))}

            {!isOwner ? (
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
                Leave space
              </Button>
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
                Delete space
              </Button>
            )}
          </ScrollView>

          <Button variant="plain" fullWidth onPress={onClose}>
            Cancel
          </Button>
        </Paper>
      </View>
    </Modal>
  );
});
