import { Screen } from "@components/Screen/Screen";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import {
  spaceSettingsHref,
  SpaceSettingsNavContent,
} from "@components/Space/sheet/SpaceSettingsNavContent";
import { SpaceSheetModalHeader } from "@components/Space/sheet/components";
import type { SpaceSettingsPage } from "@components/SpaceSettings/spaceSettingsPages";
import { useAppNavigation } from "@hooks/useAppNavigation";
import {
  useRequireSpaceSettingsAccess,
} from "@hooks/useSpaceFromRoute";
import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

const SpaceSettingsIndex = () => {
  const { t } = useTranslation("space");
  const { navigate, back } = useAppNavigation();
  const { space, spaceId } = useRequireSpaceSettingsAccess();

  if (!space || !spaceId) return null;

  const onNavigate = (page: SpaceSettingsPage) => {
    navigate(spaceSettingsHref(spaceId, page));
  };

  return (
    <Screen style={{ flex: 1 }}>
      <Box style={{ paddingHorizontal: 16, paddingTop: 8, gap: 16 }}>
        <SpaceSheetModalHeader
          title={t("sheet.serverSettingsTitle")}
          onClose={() => back()}
          variant="back"
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
      >
        <SpaceSettingsNavContent space={space} onNavigate={onNavigate} />
      </ScrollView>
    </Screen>
  );
};

export default observer(SpaceSettingsIndex);
