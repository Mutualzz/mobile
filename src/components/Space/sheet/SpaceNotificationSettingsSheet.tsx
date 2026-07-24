import { Button } from "@components/Button";
import {
  SpaceSheetMenuDivider,
  SpaceSheetMenuGroup,
  SpaceSheetMenuGroupChildren,
  SpaceSheetModalHeader,
  SpaceSheetRadioRow,
  SpaceSheetToggleRow,
} from "@components/Space/sheet/components";
import { useOpenSpaceMuteDurationSheet } from "@components/Space/sheet/useOpenSpaceMuteDurationSheet";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import {
  DEFAULT_NOTIFICATION_LEVEL,
  isNotificationMuteActive,
  NotificationLevel,
} from "@mutualzz/types";
import type { PatchSpaceNotificationSettings } from "@mutualzz/validators";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

const NESTED_SHEET_PROPS = {
  snapPoints: ["90%"],
  enableDynamicSizing: false,
  showHandle: true,
  showCloseButton: false,
};

interface Props {
  space: Space;
  sheetId: string;
}

export const SpaceNotificationSettingsSheet = observer(
  ({ space, sheetId }: Props) => {
    const { t } = useTranslation("space");
    const { t: tChat } = useTranslation("chat");
    const app = useAppStore();
    const { closeSheet } = useSheet();
    const openMuteDurationPicker = useOpenSpaceMuteDurationSheet();
    const spaceSettings = app.spaceNotifications.get(space.id);
    const level = spaceSettings?.level ?? DEFAULT_NOTIFICATION_LEVEL;
    const isMuted = isNotificationMuteActive(spaceSettings?.mutedUntil);

    const close = () => closeSheet(sheetId);

    const patchSpaceNotifications = (body: PatchSpaceNotificationSettings) => {
      void app.spaceNotifications.patch(space.id, body);
    };

    return (
      <View style={{ flex: 1, width: "100%" }}>
        <Box style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <SpaceSheetModalHeader
            title={t("sheet.notificationSettingsTitle")}
            onClose={close}
          />
        </Box>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 32,
            gap: 20,
            paddingTop: 8,
          }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <Box style={{ gap: 8 }}>
            <Button
              fullWidth
              color="primary"
              onPress={() =>
                isMuted
                  ? patchSpaceNotifications({ muteDuration: "off" })
                  : patchSpaceNotifications({ muteDuration: "forever" })
              }
            >
              {isMuted
                ? t("sheet.unmuteSpace", { spaceName: space.name })
                : t("sheet.muteSpace", { spaceName: space.name })}
            </Button>
            {!isMuted ? (
              <Button
                fullWidth
                variant="plain"
                horizontalAlign="left"
                onPress={() => openMuteDurationPicker(space, { timedOnly: true })}
              >
                {tChat("contextMenu.muteSpaceForDuration")}
              </Button>
            ) : null}
            <Typography level="body-xs" textColor="muted">
              {t("sheet.muteHelper")}
            </Typography>
            {isMuted ? (
              <Typography level="body-sm" weight={600}>
                {t("sheet.mutedStatus")}
              </Typography>
            ) : null}
          </Box>

          <Box style={{ gap: 8 }}>
            <Typography
              level="body-xs"
              textColor="muted"
              style={{ paddingHorizontal: 4, textTransform: "uppercase" }}
            >
              {t("sheet.serverNotificationSettings")}
            </Typography>
            <SpaceSheetMenuGroupChildren
              rows={[
                <SpaceSheetRadioRow
                  key="all"
                  label={tChat("contextMenu.notificationAll")}
                  selected={level === NotificationLevel.All}
                  onPress={() =>
                    patchSpaceNotifications({ level: NotificationLevel.All })
                  }
                />,
                <SpaceSheetRadioRow
                  key="mentions"
                  label={tChat("contextMenu.notificationMentions")}
                  selected={level === NotificationLevel.Mentions}
                  onPress={() =>
                    patchSpaceNotifications({
                      level: NotificationLevel.Mentions,
                    })
                  }
                />,
                <SpaceSheetRadioRow
                  key="nothing"
                  label={tChat("contextMenu.notificationNothing")}
                  selected={level === NotificationLevel.Nothing}
                  onPress={() =>
                    patchSpaceNotifications({ level: NotificationLevel.Nothing })
                  }
                />,
              ]}
            />
          </Box>

          <Box style={{ gap: 8 }}>
            <Typography
              level="body-xs"
              textColor="muted"
              style={{ paddingHorizontal: 4, textTransform: "uppercase" }}
            >
              {t("sheet.suppressSettings")}
            </Typography>
            <SpaceSheetMenuGroup>
              <Box style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <SpaceSheetToggleRow
                  title={tChat("contextMenu.suppressEveryone")}
                  checked={spaceSettings?.suppressEveryone ?? false}
                  onChange={(checked) =>
                    patchSpaceNotifications({ suppressEveryone: checked })
                  }
                />
              </Box>
              <SpaceSheetMenuDivider />
              <Box style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <SpaceSheetToggleRow
                  title={tChat("contextMenu.suppressRoles")}
                  checked={spaceSettings?.suppressRoles ?? false}
                  onChange={(checked) =>
                    patchSpaceNotifications({ suppressRoles: checked })
                  }
                />
              </Box>
            </SpaceSheetMenuGroup>
          </Box>
        </ScrollView>
      </View>
    );
  },
);

export function useOpenSpaceNotificationSettingsSheet() {
  const { openSheet } = useSheet();

  return useCallback(
    (space: Space) => {
      const sheetId = `space-notifications-${space.id}`;
      openSheet(
        sheetId,
        <SpaceNotificationSettingsSheet space={space} sheetId={sheetId} />,
        NESTED_SHEET_PROPS,
      );
    },
    [openSheet],
  );
}
