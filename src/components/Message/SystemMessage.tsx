import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { UserAvatar } from "@components/User/UserAvatar";
import { Box } from "@mutualzz/ui-native";
import { type MessageLike } from "@stores/objects/Message";
import { observer } from "mobx-react-lite";
import { MessageAuthor } from "./MessageAuthor";
import {
    MessageBase,
    MessageContent,
    MessageContentText,
    MessageInfo,
} from "./MessageBase";
import { MessageEmbed } from "./MessageEmbed";

interface Props {
    message: MessageLike;
}

export const SystemMessage = observer(({ message }: Props) => {
    return (
        <MessageBase header>
            <MessageInfo>
                <UserAvatar user={message.author} size="lg" />
            </MessageInfo>
            <MessageContent>
                <MessageAuthor message={message} />
                {message.content && (
                    <MessageContentText>
                        <MarkdownRenderer
                            variant="plain"
                            textColor="primary"
                            spaceId={message.spaceId}
                            value={message.content}
                        />
                    </MessageContentText>
                )}
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
