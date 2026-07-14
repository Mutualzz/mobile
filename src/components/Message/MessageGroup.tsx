import { MessageType } from "@mutualzz/types";
import type { MessageGroup as MessageGroupType } from "@stores/Message.store";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { Message } from "./Message";
import { SystemMessage } from "./SystemMessage";

interface Props {
    group: MessageGroupType;
    highlightedMessageId?: string | null;
}

export const MessageGroup = observer(
    ({ group, highlightedMessageId }: Props) => {
        const { messages } = group;

        return (
            <Box style={{ flexDirection: "column-reverse" }}>
                {messages.map((message, index) => {
                    if (message.type === MessageType.Default) {
                        return (
                            <Message
                                key={message.id}
                                message={message}
                                header={index === messages.length - 1}
                                highlighted={
                                    highlightedMessageId === message.id
                                }
                            />
                        );
                    }

                    if (message.type === MessageType.Reply) {
                        return (
                            <Message
                                key={message.id}
                                message={message}
                                header
                                highlighted={
                                    highlightedMessageId === message.id
                                }
                            />
                        );
                    }

                    return <SystemMessage key={message.id} message={message} />;
                })}
            </Box>
        );
    },
);
