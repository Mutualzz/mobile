import { formatColor, type ColorLike } from "@mutualzz/ui-core";
import { Image, View } from "react-native";

const icon = require("../../../assets/icon.png");

interface Props {
    primaryColor: ColorLike;
    size?: number;
}

export const AdaptiveIconSwatch = ({ primaryColor, size = 64 }: Props) => (
    <View
        style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
            backgroundColor: formatColor(primaryColor),
        }}
    >
        <Image
            source={icon}
            style={{
                width: size,
                height: size,
            }}
            resizeMode="cover"
        />
    </View>
);
