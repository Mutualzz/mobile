import { SheetHostBootstrap } from "@components/SheetHost/SheetHostBootstrap";
import { Box } from "@mutualzz/ui-native";
import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";

const StaffLayout = () => {
  return (
    <SheetHostBootstrap id="staff" priority={1}>
      <Box style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </Box>
    </SheetHostBootstrap>
  );
};

export default observer(StaffLayout);
