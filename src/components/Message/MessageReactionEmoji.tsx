import { useAppStore } from "@hooks/useStores";
import type { APIMessageReactionEmoji } from "@mutualzz/types";
import { UnicodeEmoji } from "@components/emojis/UnicodeEmoji";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Image } from "react-native";

interface Props {
    emoji: APIMessageReactionEmoji;
    size?: number;
}

export const MessageReactionEmoji = observer(({ emoji, size = 18 }: Props) => {
    const app = useAppStore();

    useEffect(() => {
        if (
            emoji.type === "expression" &&
            !app.expressions.get(emoji.expression.id)
        ) {
            void app.expressions.resolve(emoji.expression.id);
        }
    }, [app.expressions, emoji]);

    if (emoji.type === "expression") {
        const expression = app.expressions.get(emoji.expression.id);
        if (!expression?.url) return null;

        return (
            <Image
                source={{ uri: expression.url }}
                style={{ width: size, height: size }}
                resizeMode="contain"
            />
        );
    }

    return <UnicodeEmoji value={emoji.value} size={size} />;
});
