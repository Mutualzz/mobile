import { Box } from "@mutualzz/ui-native";
import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";

const StaffLayout = () => {
  return (
    <Box style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Box>
  );
};

export default observer(StaffLayout);
