import { FeedHeader } from "@components/Feed/FeedHeader";
import { PostList } from "@components/Feed/PostList";
import { Screen } from "@components/Screen/Screen";
import { useKeyboardChromeInset } from "@hooks/useKeyboardChromeInset";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

const FeedSavedScreen = () => {
  const tabBarInset = useKeyboardChromeInset();

  return (
    <Screen
      style={{
        flexDirection: "column",
        paddingBottom: tabBarInset,
        borderTopWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
      }}
    >
      <FeedHeader />
      <Box style={{ flex: 1 }}>
        <PostList variant="saved" />
      </Box>
    </Screen>
  );
};

export default observer(FeedSavedScreen);
