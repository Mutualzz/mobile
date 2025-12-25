import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { Paper } from "@components/Paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppStore } from "@hooks/useStores";
import { MessageType } from "@mutualzz/types";
import { IconButton } from "@mutualzz/ui-native";
import { Channel } from "@stores/objects/Channel";
import { Selection } from "@utils/markdown/types";
import Snowflake from "@utils/Snowflake";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
    channel: Channel;
}

export const MessageInput = observer(({ channel }: Props) => {
    const app = useAppStore();
    const insets = useSafeAreaInsets();
    const [content, setContent] = useState("");
    const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 });

    const canSendMessage = useCallback(
        () =>
            !(!content || !content.trim() || !content.replace(/\r?\n|\r/g, "")),
        [content],
    );

    const sendMessage = useCallback(async () => {
        if (!canSendMessage()) return;

        const nonce = Snowflake.generate();
        const author = app.account!.raw;
        const msg = app.queue.add({
            id: nonce,
            content,
            author,
            authorId: author.id,
            channelId: channel!.id,
            spaceId: channel?.space?.id ?? null,
            createdAt: new Date().toISOString(),
            type: MessageType.Default,
        });

        const body = {
            content,
            nonce,
        };

        try {
            setContent("");
            setSelection({ start: 0, end: 0 });

            await channel?.sendMessage(body, msg);
        } catch (e) {
            const error =
                e instanceof Error
                    ? e.message
                    : typeof e === "string"
                      ? e
                      : "Unknown error";

            msg.fail(error);
        }
    }, [content, channel, canSendMessage, app.account, app.queue]);

    return (
        <Paper
            elevation={app.preferEmbossed ? 4 : 0}
            style={{
                flexShrink: 0,
                flexGrow: 0,
                flexDirection: "row",
                alignItems: "center",

                paddingLeft: 16,
                paddingRight: 16,
                paddingBottom: insets.bottom,
                paddingTop: 12,
            }}
        >
            <MarkdownInput
                value={content}
                onChange={setContent}
                selection={selection}
                onChangeSelection={setSelection}
                enableEmoticons
                placeholder={`Message #${channel.name}`}
                elevation={app.preferEmbossed ? 5 : 0}
                paddingLeft={16}
                paddingRight={16}
                paddingTop={12}
                paddingBottom={12}
                style={{
                    minHeight: 44,
                    maxHeight: 160,
                    flex: 1,
                    marginLeft: 8,
                    marginRight: 8,
                }}
            />
            {content.length > 0 && (
                <IconButton
                    padding={8}
                    style={{
                        borderRadius: 999,
                    }}
                    size="lg"
                    color="primary"
                    onPress={() => sendMessage()}
                >
                    <MaterialIcons name="send" />
                </IconButton>
            )}
        </Paper>
    );
});
