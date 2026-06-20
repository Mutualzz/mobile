import TabButton from "@components/Tabs/TabButton";
import { HouseIcon } from "phosphor-react-native";
import { useAppStore } from "@hooks/useStores";
import { Box, useTheme } from "@mutualzz/ui-native";
import { TabTrigger } from "expo-router/ui";

export const HomeContextual = () => {
  const app = useAppStore();
  const { theme } = useTheme();

  const determineContext = app.mode ?? app.settings?.preferredMode ?? "spaces";

  return (
    <Box
      style={{
        flex: 1,
        flexDirection: "column",
      }}
    >
      <TabTrigger asChild name={determineContext}>
        <TabButton
          icon={
            <HouseIcon size={30} color={theme.colors.neutral} weight="fill" />
          }
        >
          Home
        </TabButton>
      </TabTrigger>
    </Box>
  );
};
