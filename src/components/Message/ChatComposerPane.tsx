import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { ComposerFooter } from "@components/Message/ComposerFooter";
import { MessageInput } from "@components/Message/MessageInput";
import { MessageList } from "@components/Message/MessageList";
import type { Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";
import { Platform } from "react-native";

interface Props {
  channel: Channel;
  composerVisible: boolean;
}

export const ChatComposerPane = observer(
  ({ channel, composerVisible }: Props) => {
    const footer = (
      <ComposerFooter channelId={channel.id}>
        {composerVisible ? <MessageInput channel={channel} /> : null}
      </ComposerFooter>
    );

    return (
      <AppKeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        automaticOffset={false}
        style={{ flex: 1, minHeight: 0, flexDirection: "column" }}
      >
        <MessageList channel={channel} />
        {footer}
      </AppKeyboardAvoidingView>
    );
  },
);
