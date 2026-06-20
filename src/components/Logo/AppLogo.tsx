import { Image, Pressable, type ImageProps } from "react-native";

const icon = require("../../../assets/icon.png");

interface Props {
    size?: number;
    onPress?: () => void;
    style?: ImageProps["style"];
}

export const AppLogo = ({ size = 48, onPress, style }: Props) => {
    const image = (
        <Image
            source={icon}
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                },
                style,
            ]}
        />
    );

    if (!onPress) return image;

    return (
        <Pressable onPress={onPress} hitSlop={8}>
            {image}
        </Pressable>
    );
};
