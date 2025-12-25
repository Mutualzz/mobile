import styled from "@emotion/native";
import { Image, Platform, View } from "react-native";
import { SvgUri } from "react-native-svg";

interface EmojiProps extends Omit<any, "type" | "children"> {
    url: string;
    isEmojiOnly: boolean;
    adjust?: boolean;
}

// TODO: Fix weird text margining top issues when emoji is combined with text
const EmojiWrapper = styled(View)<{ isEmojiOnly: boolean; adjust?: boolean }>(({
    isEmojiOnly,
    adjust,
}) => {
    const defaultShouldAdjust = !(Platform.OS === "android" && isEmojiOnly);
    const shouldAdjust = adjust ?? defaultShouldAdjust;
    return {
        width: isEmojiOnly ? 36 : 22,
        height: isEmojiOnly ? 36 : 22,

        transform: [{ translateY: shouldAdjust ? 5 : 0 }],
        justifyContent: "center",
        alignItems: "center",
    };
});

export const Emoji = ({ isEmojiOnly, adjust, url }: EmojiProps) => {
    const toRender = url.endsWith(".svg") ? (
        <SvgUri
            uri={url}
            style={{
                width: "100%",
                height: "100%",
            }}
        />
    ) : (
        <Image
            source={{ uri: url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
        />
    );

    return (
        <EmojiWrapper adjust={adjust} isEmojiOnly={isEmojiOnly}>
            {toRender}
        </EmojiWrapper>
    );
};
