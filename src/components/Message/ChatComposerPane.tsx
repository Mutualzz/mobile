import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { ComposerFooter } from "@components/Message/ComposerFooter";
import { MessageInput } from "@components/Message/MessageInput";
import { MessageList } from "@components/Message/MessageList";
import type { Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";

interface Props {
  channel: Channel;
  composerVisible: boolean;
}

export const ChatComposerPane = observer(
  ({ channel, composerVisible }: Props) => {
    return (
      <AppKeyboardAvoidingView
        style={{ flex: 1, minHeight: 0, flexDirection: "column" }}
      >
        <MessageList channel={channel} />
        <ComposerFooter channelId={channel.id}>
          {composerVisible ? <MessageInput channel={channel} /> : null}
        </ComposerFooter>
      </AppKeyboardAvoidingView>
    );
  },
);
