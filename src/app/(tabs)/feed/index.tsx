import { Screen } from "@components/Screen/Screen";
import { useTabBarContentInset } from "@hooks/useTabBarContentInset";
import { Stack, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

export default observer(() => {
  const tabBarInset = useTabBarContentInset();

  return (
    <Screen
      style={{
        flexDirection: "row",
        paddingBottom: tabBarInset,
        borderTopWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
      }}
    >
      <Stack
        flex={1}
        justifyContent="center"
        alignItems="center"
        style={{
          paddingHorizontal: 20,
        }}
      >
        <Typography style={{ textAlign: "center" }} textColor="muted">
          Your feed is coming soon. Use the sidebar to view your public profile
          or customize your page.
        </Typography>
      </Stack>
    </Screen>
  );
});
