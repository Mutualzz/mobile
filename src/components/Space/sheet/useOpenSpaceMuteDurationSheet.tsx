import { Button } from "@components/Button";
import {
  SpaceSheetMenuDivider,
  SpaceSheetMenuGroup,
} from "@components/Space/sheet/components";
import {
  SPACE_MUTE_DURATIONS,
  SPACE_MUTE_TIMED_DURATIONS,
} from "@components/Space/sheet/spaceMuteDurations";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import type { PatchSpaceNotificationSettings } from "@mutualzz/validators";
import { Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export function useOpenSpaceMuteDurationSheet() {
  const { t } = useTranslation("chat");
  const app = useAppStore();
  const { openSheet, closeSheet } = useSheet();

  return useCallback(
    (space: Space, options?: { timedOnly?: boolean }) => {
      const pickerId = `space-mute-duration-${space.id}`;
      const durations = options?.timedOnly
        ? SPACE_MUTE_TIMED_DURATIONS
        : SPACE_MUTE_DURATIONS;

      const patchSpaceNotifications = (
        body: PatchSpaceNotificationSettings,
      ) => {
        void app.spaceNotifications.patch(space.id, body);
      };

      openSheet(
        pickerId,
        <View style={{ width: "100%", padding: 16, gap: 12 }}>
          <Typography level="body-lg" weight="bold">
            {t("contextMenu.muteSpace")}
          </Typography>
          <SpaceSheetMenuGroup>
            {durations.map(({ duration, labelKey }, index) => (
              <View key={duration}>
                {index > 0 ? <SpaceSheetMenuDivider /> : null}
                <Button
                  variant="plain"
                  fullWidth
                  padding={14}
                  horizontalAlign="left"
                  onPress={() => {
                    patchSpaceNotifications({ muteDuration: duration });
                    closeSheet(pickerId);
                  }}
                >
                  {t(labelKey)}
                </Button>
              </View>
            ))}
          </SpaceSheetMenuGroup>
        </View>,
        { enableDynamicSizing: true, showCloseButton: false },
      );
    },
    [app.spaceNotifications, closeSheet, openSheet, t],
  );
}
