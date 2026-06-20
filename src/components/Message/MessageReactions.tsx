import { Box, Typography } from "@mutualzz/ui-native";
import { Message } from "@stores/objects/Message";
import { observer } from "mobx-react-lite";
import { Pressable } from "react-native";
import { MessageReactionEmoji } from "./MessageReactionEmoji";

interface Props {
    message: Message;
}

export const MessageReactions = observer(({ message }: Props) => {
    if (message.editing) return null;

    return (
        <Box
            style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 4,
            }}
        >
            {message.reactions.map((reaction) => (
                <Pressable
                    key={
                        reaction.emoji.type === "unicode"
                            ? reaction.emoji.value
                            : reaction.emoji.expression.id
                    }
                    onPress={() => void message.toggleReaction(reaction.emoji)}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: reaction.me
                            ? "rgba(88, 101, 242, 0.2)"
                            : "rgba(255, 255, 255, 0.08)",
                    }}
                >
                    <MessageReactionEmoji emoji={reaction.emoji} />
                    <Typography level="body-xs">{reaction.count}</Typography>
                </Pressable>
            ))}
        </Box>
    );
});
