import { UserEmojisTab } from "@components/UserSettings/UserEmojisTab";
import { UserStickersTab } from "@components/UserSettings/UserStickersTab";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";

type Tab = "emojis" | "stickers";

const tabs: Tab[] = ["emojis", "stickers"];

export const UserExpressionsSettings = observer(() => {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();
  const [currentTab, setCurrentTab] = useState<Tab>("emojis");

  return (
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
                {t(`expressions.${tab}`)}
              </Typography>
            </Pressable>
          );
        })}
      </Box>

      {currentTab === "emojis" ? <UserEmojisTab /> : <UserStickersTab />}
    </ScrollView>
  );
});
