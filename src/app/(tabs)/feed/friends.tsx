import { FeedHeader } from "@components/Feed/FeedHeader";
import { PostList } from "@components/Feed/PostList";
import { KeyboardAwareView } from "@components/Keyboard/KeyboardAwareView";
import { Screen } from "@components/Screen/Screen";
import { useTabBarContentInset } from "@hooks/useTabBarContentInset";
import { observer } from "mobx-react-lite";

const FeedFriendsScreen = () => {
  const tabBarInset = useTabBarContentInset();

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
      <KeyboardAwareView>
        <PostList variant="friends" showComposer />
      </KeyboardAwareView>
    </Screen>
  );
};

export default observer(FeedFriendsScreen);
