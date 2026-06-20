import { Emoji } from "@components/Markdown/components/Emoji";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import { findCustomEmoji } from "@utils/emojis/customEmoji";
import { observer } from "mobx-react-lite";

interface Props {
    raw: string;
    isEmojiOnly?: boolean;
}

export const CustomEmoji = observer(({ raw, isEmojiOnly = false }: Props) => {
    const app = useAppStore();
    const expression = findCustomEmoji(app, raw);

    if (!expression?.url) {
        return <Typography level="body-sm">{raw}</Typography>;
    }

    return (
        <Emoji
            url={expression.url}
            isEmojiOnly={isEmojiOnly}
            name={expression.name}
        />
    );
});
