import { SpaceIcon } from "@components/Space/SpaceIcon";
import {
  SpaceSheetModalHeader,
} from "@components/Space/sheet/components";
import {
  spaceSettingsHref,
  SpaceSettingsNavContent,
} from "./SpaceSettingsNavContent";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useSheet } from "@hooks/useSheet";
import type { SpaceSettingsPage } from "@components/SpaceSettings/spaceSettingsPages";
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

export const SpaceSettingsSheet = observer(({ space, sheetId }: Props) => {
  const { t } = useTranslation("space");
  const { closeSheet } = useSheet();
  const { navigate } = useAppNavigation();

  const close = () => closeSheet(sheetId);

  const onNavigate = (page: SpaceSettingsPage) => {
    close();
    navigate(spaceSettingsHref(space.id, page));
  };

  return (
    <View style={{ flex: 1, width: "100%" }}>
      <Box style={{ paddingHorizontal: 16, paddingTop: 8, gap: 16 }}>
        <SpaceSheetModalHeader
          title={t("sheet.serverSettingsTitle")}
          onClose={close}
        />
        <Box style={{ alignItems: "center", gap: 8, paddingVertical: 8 }}>
          <SpaceIcon space={space} size={80} />
          <Typography level="title-sm" weight={700} truncate="single">
            {space.name}
          </Typography>
        </Box>
      </Box>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <SpaceSettingsNavContent
          space={space}
          onNavigate={onNavigate}
          onDangerAction={close}
        />
      </ScrollView>
    </View>
  );
});

export function useOpenSpaceSettingsSheet() {
  const { openSheet } = useSheet();

  return useCallback(
    (space: Space) => {
      const sheetId = `space-settings-${space.id}`;
      openSheet(
        sheetId,
        <SpaceSettingsSheet space={space} sheetId={sheetId} />,
        NESTED_SHEET_PROPS,
      );
    },
    [openSheet],
  );
}
