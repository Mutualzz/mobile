import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { Box } from "@mutualzz/ui-native";
import { type MessageLike } from "@stores/objects/Message";
import { QueuedMessageStatus } from "@stores/objects/QueuedMessage";
import { observer } from "mobx-react-lite";
import { MessageAuthor } from "./MessageAuthor";
import { MessageBase, MessageContent, MessageContentText, MessageDetails, MessageInfo, } from "./MessageBase";
import { MessageEmbed } from "./MessageEmbed";

interface Props {
    message: MessageLike;
    header?: boolean;
}

export const Message = observer(({ message, header }: Props) => {
    const app = useAppStore();
    const space = message.spaceId ? app.spaces.get(message.spaceId) : null;

    return (
        <MessageBase header={header}>
            <MessageInfo>
                {header && <UserAvatar user={message.author} />}
            </MessageInfo>
            <MessageContent>
                {header && (
                    <Box
                        style={{
                            flexShrink: 0,
                            flexDirection: "row",
                        }}
                    >
                        <MessageAuthor message={message} space={space} />
                        <MessageDetails message={message} />
                    </Box>
                )}

                <MessageContentText
                    sending={
                        "status" in message &&
                        message.status === QueuedMessageStatus.Sending
                    }
                    failed={
                        "status" in message &&
                        message.status === QueuedMessageStatus.Failed
                    }
                >
                    {message.content && (
                        <MarkdownRenderer
                            variant="plain"
                            textColor="primary"
                            value={message.content}
                        />
                    )}
                </MessageContentText>

                {"embeds" in message && message.embeds.length > 0 && (
                    <Box
                        style={{
                            paddingBottom: 4,
                        }}
                    >
                        {message.embeds.map((embed, index) => (
                            <MessageEmbed key={index} embed={embed} />
                        ))}
                    </Box>
                )}
            </MessageContent>
        </MessageBase>
    );
});
