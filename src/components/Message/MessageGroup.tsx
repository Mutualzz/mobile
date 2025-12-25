import { MessageType } from "@mutualzz/types";
import type { MessageGroup as MessageGroupType } from "@stores/Message.store";
import { observer } from "mobx-react-lite";
import { Message } from "./Message";

interface Props {
    group: MessageGroupType;
}

export const MessageGroup = observer(({ group }: Props) => {
    const { messages } = group;

    return (
        <>
            {messages.map((message, index) => {
                if (!message.content) return <></>;
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

                return <></>;
            })}
        </>
    );
});
