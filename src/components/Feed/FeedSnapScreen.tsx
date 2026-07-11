import { FeedHeader } from "@components/Feed/FeedHeader";
import { PostList } from "@components/Feed/PostList";
import type { FeedVariant } from "@components/Feed/useFeedPosts";
import { Screen } from "@components/Screen/Screen";
import { useKeyboardChromeInset } from "@hooks/useKeyboardChromeInset";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";

interface Props {
  variant: FeedVariant;
}

export const FeedSnapScreen = observer(({ variant }: Props) => {
  const tabBarInset = useKeyboardChromeInset();
  const [listHeight, setListHeight] = useState(0);

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
      <Box
        style={{ flex: 1 }}
        onLayout={(event) => {
          const nextHeight = Math.round(event.nativeEvent.layout.height);
          if (nextHeight !== listHeight) setListHeight(nextHeight);
        }}
      >
        {listHeight > 0 && (
          <PostList variant={variant} snap listHeight={listHeight} />
        )}
      </Box>
    </Screen>
  );
});
