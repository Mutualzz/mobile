import { ComposerFooter } from "@components/Message/ComposerFooter";
import { KeyboardComposer } from "@components/Keyboard/KeyboardComposer";
import { MessageInput } from "@components/Message/MessageInput";
import { MessageList } from "@components/Message/MessageList";
import type { Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";

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

export const ChatComposerPane = observer(
  ({ channel, composerVisible }: Props) => (
    <KeyboardComposer
      footer={
        <ChatFooter channel={channel} composerVisible={composerVisible} />
      }
    >
      <MessageList channel={channel} />
    </KeyboardComposer>
  ),
);
