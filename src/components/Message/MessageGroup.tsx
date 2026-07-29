import { MessageType } from "@mutualzz/types";
import type { MessageGroup as MessageGroupType } from "@stores/Message.store";
import { Box } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { Message } from "./Message";
import { SystemMessage } from "./SystemMessage";
import { useAppStore } from "@hooks/useStores";
import {
    getMessageLayoutStyles,
    shouldShowMessageAvatar,
} from "@utils/messageLayout";

interface Props {
    group: MessageGroupType;
    highlightedMessageId?: string | null;
}

export const MessageGroup = observer(
    ({ group, highlightedMessageId }: Props) => {
        const app = useAppStore();
        const { messages } = group;
        const messageDisplay = app.settings?.messageDisplay ?? "default";
        const uiDensity = app.settings?.uiDensity ?? "default";
        const compact = messageDisplay === "compact";
        const layoutStyles = getMessageLayoutStyles(messageDisplay, uiDensity);

        return (
            <Box
                style={{
                    flexDirection: "column-reverse",
                    marginBottom: layoutStyles.groupGapNative,
                }}
            >
                {messages.map((message, index) => {
                    const isGroupStart = index === messages.length - 1;

                    if (message.type === MessageType.Default) {
                        const showAvatar = shouldShowMessageAvatar(
                            messageDisplay,
                            isGroupStart,
                        );

                        return (
                            <Message
                                key={message.id}
                                message={message}
                                header={isGroupStart}
                                showAvatar={showAvatar}
                                compact={compact}
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
                                showAvatar={shouldShowMessageAvatar(
                                    messageDisplay,
                                    true,
                                )}
                                compact={compact}
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
