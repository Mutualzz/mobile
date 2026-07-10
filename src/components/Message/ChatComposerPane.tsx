import { ComposerFooter } from "@components/Message/ComposerFooter";
import { MessageInput } from "@components/Message/MessageInput";
import { MessageList } from "@components/Message/MessageList";
import { useKeyboardPaddingStyle } from "@hooks/useKeyboardPaddingStyle";
import type { Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { KeyboardStickyView } from "react-native-keyboard-controller";

interface Props {
  channel: Channel;
  composerVisible: boolean;
}

const ChatFooter = observer(
  ({
    channel,
    composerVisible,
  }: {
    channel: Channel;
    composerVisible: boolean;
  }) => (
    <ComposerFooter channelId={channel.id}>
      {composerVisible ? <MessageInput channel={channel} /> : null}
    </ComposerFooter>
  ),
);

/**
 * Discord-style chat keyboard handling for drawer-transformed content:
 * - shrink the message list viewport as the keyboard opens
 * - stick the composer to the keyboard on the UI thread (works inside transforms)
 */
export const ChatComposerPane = observer(
  ({ channel, composerVisible }: Props) => {
    const listInsetStyle = useKeyboardPaddingStyle();

    return (
      <View style={{ flex: 1, minHeight: 0 }}>
        <Animated.View style={[{ flex: 1, minHeight: 0 }, listInsetStyle]}>
          <MessageList channel={channel} />
        </Animated.View>
        <KeyboardStickyView>
          <ChatFooter channel={channel} composerVisible={composerVisible} />
        </KeyboardStickyView>
      </View>
    );
  },
);
