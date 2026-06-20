import { Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { Screen } from "@components/Screen/Screen";

export default observer(() => {
  return (
    <Screen
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
      }}
    >
      <Typography style={{ textAlign: "center" }}>
        Here will be your feed, currently working on spaces
      </Typography>
    </Screen>
  );
});
