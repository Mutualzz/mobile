import { SpaceEmojisSettings } from "@components/SpaceSettings/SpaceEmojisSettings";
import { SpaceStickersSettings } from "@components/SpaceSettings/SpaceStickersSettings";
import { SpaceSettingsScreen } from "@components/SpaceSettings/SpaceSettingsScreen";
import { useRequireSpaceSettingsAccess } from "@hooks/useSpaceFromRoute";
import { spacePageTitleKeys } from "@mutualzz/i18n";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

type Tab = "emojis" | "stickers";

const tabs: Tab[] = ["emojis", "stickers"];

const SpaceExpressionsSettingsPage = () => {
  const { t } = useTranslation("space");
  const { t: tSettings } = useTranslation("settings");
  const { theme } = useTheme();
  const { space } = useRequireSpaceSettingsAccess();
  const [currentTab, setCurrentTab] = useState<Tab>("emojis");

  if (!space) return null;

  return (
    <SpaceSettingsScreen
      title={t(spacePageTitleKeys.expressions)}
      contentStyle={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Box style={{ flexDirection: "row", gap: 16 }}>
          {tabs.map((tab) => {
            const selected = currentTab === tab;

            return (
              <Pressable
                key={tab}
                onPress={() => setCurrentTab(tab)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 4,
                  borderBottomWidth: selected ? 2 : 0,
                  borderBottomColor: selected
                    ? theme.typography.colors.accent
                    : "transparent",
                }}
              >
                <Typography
                  level="body-sm"
                  weight={selected ? 700 : 400}
                  textColor={selected ? undefined : "muted"}
                >
                  {tSettings(`expressions.${tab}`)}
                </Typography>
              </Pressable>
            );
          })}
        </Box>

        {currentTab === "emojis" ? (
          <SpaceEmojisSettings space={space} />
        ) : (
          <SpaceStickersSettings space={space} />
        )}
      </ScrollView>
    </SpaceSettingsScreen>
  );
};

export default observer(SpaceExpressionsSettingsPage);
