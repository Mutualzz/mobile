import TabButton from "@components/Tabs/TabButton";
import { HouseIcon } from "phosphor-react-native";
import { useAppStore } from "@hooks/useStores";
import { resolveActiveModeKey } from "@mutualzz/client";
import { Box, useTheme } from "@mutualzz/ui-native";
import { usePathname } from "expo-router";
import { TabTrigger } from "expo-router/ui";
import { useTranslation } from "react-i18next";

export const HomeContextual = () => {
  const app = useAppStore();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { t } = useTranslation("chat");

  const modeKey = resolveActiveModeKey(pathname, null, app.mode);
  const tabName = modeKey === "dms" ? "@me" : modeKey;

  return (
    <Box
      style={{
        flex: 1,
        flexDirection: "column",
      }}
    >
      <TabTrigger asChild name={tabName}>
        <TabButton
          icon={
            <HouseIcon size={30} color={theme.colors.neutral} weight="fill" />
          }
        >
          {t("home")}
        </TabButton>
      </TabTrigger>
    </Box>
  );
};
