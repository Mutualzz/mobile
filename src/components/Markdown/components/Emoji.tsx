import { Box } from "@mutualzz/ui-native";
import { Image } from "react-native";
import { SvgUri } from "react-native-svg";

interface EmojiProps {
    url: string;
    isEmojiOnly: boolean;
    name?: string;
    unicode?: string;
}

export const Emoji = ({ isEmojiOnly, url }: EmojiProps) => {
    const size = isEmojiOnly ? 36 : 22;

    const image = url.endsWith(".svg") ? (
        <SvgUri uri={url} width={size} height={size} />
    ) : (
        <Image
            source={{ uri: url }}
            style={{ width: size, height: size }}
            resizeMode="contain"
        />
    );

    return (
        <Box
            style={{
                width: size,
                height: size,
                justifyContent: "center",
                alignItems: "center",
                overflow: "visible",
            }}
        >
            {image}
        </Box>
    );
};
