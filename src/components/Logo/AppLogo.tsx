import { useAppStore } from "@hooks/useStores";
import { useTheme } from "@mutualzz/ui-native";
import { Theme } from "@stores/objects/Theme";
import { observer } from "mobx-react-lite";
import { Image, Pressable, View, type ImageProps } from "react-native";

const mark = require("../../../assets/adaptive-icon.png");

interface Props {
  size?: number;
  onPress?: () => void;
  style?: ImageProps["style"];
  selected?: boolean;
}

export const AppLogo = observer(
  ({ size = 48, onPress, style, selected = false }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();

  const themeToUse = app.themes.currentIcon
    ? (app.themes.get(app.themes.currentIcon) ?? theme)
    : theme;
  const primary = Theme.toEmotion(themeToUse).colors.primary;
  const borderRadius = selected ? 15 : size / 2;

  const image = (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: primary,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Image
        source={mark}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );

  if (!onPress) return image;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityState={{ selected }}
    >
      {image}
    </Pressable>
  );
},
);
