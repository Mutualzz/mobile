import type { Expression } from "@stores/objects/Expression";
import { Image, Pressable } from "react-native";

interface Props {
    sticker: Expression;
    size?: number;
}

export const MessageSticker = ({ sticker, size = 160 }: Props) => (
    <Pressable
        accessibilityLabel={sticker.name}
        style={{
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
        }}
    >
        <Image
            source={{ uri: sticker.url }}
            style={{ width: size, height: size }}
            resizeMode="contain"
        />
    </Pressable>
);
