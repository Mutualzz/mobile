import { formatColor, type ColorLike } from "@mutualzz/ui-core";
import { useScaledThemeSwatchSize } from "@utils/accessibilityLayout";
import { Image, View } from "react-native";

const DEFAULT_SIZE = 64;
const adaptiveIconMark = require("../../../assets/adaptive-icon.png");

interface Props {
  primaryColor: ColorLike;
  size?: number;
}

export const AdaptiveIconSwatch = ({ primaryColor, size = DEFAULT_SIZE }: Props) => {
  const swatchSize = useScaledThemeSwatchSize(size);

  return (
    <View
      style={{
        width: swatchSize,
        height: swatchSize,
        borderRadius: swatchSize / 2,
        overflow: "hidden",
        backgroundColor: formatColor(primaryColor),
      }}
    >
      <Image
        source={adaptiveIconMark}
        style={{
          width: swatchSize,
          height: swatchSize,
        }}
        resizeMode="cover"
      />
    </View>
  );
};
