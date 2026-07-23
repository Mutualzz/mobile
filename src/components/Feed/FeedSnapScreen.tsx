import { FeedHeader } from "@components/Feed/FeedHeader";
import { PostList } from "@components/Feed/PostList";
import type { FeedVariant } from "@components/Feed/useFeedPosts";
import { Screen } from "@components/Screen/Screen";
import { useKeyboardChromeInset } from "@hooks/useKeyboardChromeInset";
import { observer } from "mobx-react-lite";

interface Props {
  variant: FeedVariant;
}

export const FeedSnapScreen = observer(({ variant }: Props) => {
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
      <PostList variant={variant} />
    </Screen>
  );
});
