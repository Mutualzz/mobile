import { Emoji } from "@components/Markdown/components/Emoji";
import { Theme } from "@emotion/react";
import { Token } from "@utils/markdown/types";
import { TWEMOJI_URL } from "@utils/urls";
import { Text } from "react-native";

export const renderToken = (theme: Theme, t: Token, key: number) => {
    if (t.kind === "newline") return <Text key={key}>{"\n"}</Text>;

    const f = t.flags;

    if (t.kind === "emoji") {
        const url = `${TWEMOJI_URL}/${t.hexCode}.svg`;
        return <Emoji adjust={false} url={url} isEmojiOnly={false} key={key} />;
    }

    return (
        <Text
            key={key}
            style={{
                opacity: f.isMarker ? 0.5 : 1,

                fontWeight: f.bold ? "700" : undefined,
                fontStyle: f.italic ? "italic" : undefined,
                textDecorationLine: f.underline
                    ? "underline"
                    : f.strikethrough
                      ? "line-through"
                      : undefined,

                ...(f.code
                    ? {
                          backgroundColor: "rgba(255,255,255,0.10)",
                      }
                    : null),

                ...(f.spoiler
                    ? {
                          backgroundColor: theme.typography.colors.muted,
                      }
                    : null),
            }}
        >
            {t.text}
        </Text>
    );
};
