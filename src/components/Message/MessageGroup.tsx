import { MessageType } from "@mutualzz/types";
import type { MessageGroup as MessageGroupType } from "@stores/Message.store";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { Message } from "./Message";
import { SystemMessage } from "./SystemMessage";

interface Props {
    group: MessageGroupType;
}

export const MessageGroup = observer(({ group }: Props) => {
    const { messages } = group;

    return (
        <Box style={{ flexDirection: "column-reverse" }}>
            {messages.map((message, index) => {
                if (
                    message.type === MessageType.Default ||
                    message.type === MessageType.Reply
                ) {
                    return (
                        <Message
                            key={message.id}
                            message={message}
                            header={index === messages.length - 1}
                        />
                    );
                }

                return <SystemMessage key={message.id} message={message} />;
            })}
        </Box>
    );
});
