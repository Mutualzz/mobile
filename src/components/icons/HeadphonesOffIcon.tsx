import { HeadphonesIcon } from "phosphor-react-native";
import type { IconProps } from "phosphor-react-native";
import { View } from "react-native";
import Svg, { Line } from "react-native-svg";

export const HeadphonesOffIcon = ({
  size = 16,
  color = "currentColor",
  weight = "fill",
}: IconProps) => {
  const iconSize = typeof size === "number" ? size : 16;

  return (
    <View
      style={{
        width: iconSize,
        height: iconSize,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <HeadphonesIcon size={iconSize} color={color} weight={weight} />
      <Svg
        width={iconSize}
        height={iconSize}
        style={{ position: "absolute" }}
        viewBox="0 0 256 256"
      >
        <Line
          x1="40"
          y1="40"
          x2="216"
          y2="216"
          stroke={color}
          strokeWidth="24"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};
