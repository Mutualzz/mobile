import { useAppStore } from "@hooks/useStores";
import { useTheme } from "@mutualzz/ui-native";
import { Theme } from "@stores/objects/Theme";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import {
  Image,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const ICON_HOLD = 1.5;
const ICON_MOVE = 0.55;
const CYCLE = ICON_HOLD + ICON_MOVE;

import anarchy from "../../assets/brand-logo/anarchy.png";
import cathedral from "../../assets/brand-logo/cathedral.png";
import sceneHair from "../../assets/brand-logo/scene_hair.png";
import guitar from "../../assets/brand-logo/guitar.png";
import microphone from "../../assets/brand-logo/microphone.png";
import emoHair from "../../assets/brand-logo/emo_hair.png";
import pentagram from "../../assets/brand-logo/pentagram_overlay.png";

const ORBIT_ICONS = [cathedral, sceneHair, guitar, microphone, emoHair] as const;

interface BrandLoaderProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const BrandLoader = observer(
  ({ size = 108, color, style }: BrandLoaderProps) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const t = useSharedValue(0);

    const themeToUse = app.themes.currentIcon
      ? (app.themes.get(app.themes.currentIcon) ?? theme)
      : theme;
    const bg = color ?? Theme.toEmotion(themeToUse).colors.primary;

    useEffect(() => {
      t.value = withRepeat(
        withTiming(CYCLE * 40, {
          duration: CYCLE * 40 * 1000,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    }, [t]);

    const radius = size * 0.5;
    const count = ORBIT_ICONS.length;
    const slotStep = (Math.PI * 2) / count;
    const baseAngle = -Math.PI / 2;
    const orbitR = radius * 0.698;
    const iconSize = radius * 0.26;
    const centerSize = radius * 0.251;

    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            overflow: "hidden",
          },
          style,
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {ORBIT_ICONS.map((src, i) => (
          <OrbitIcon
            key={i}
            index={i}
            src={src}
            t={t}
            count={count}
            radius={radius}
            orbitR={orbitR}
            iconSize={iconSize}
            slotStep={slotStep}
            baseAngle={baseAngle}
          />
        ))}
        <Image
          source={anarchy}
          style={{
            position: "absolute",
            width: centerSize,
            height: centerSize,
            left: radius - centerSize / 2,
            top: radius - centerSize / 2,
          }}
          resizeMode="contain"
        />
        <Image
          source={pentagram}
          style={{
            position: "absolute",
            width: size,
            height: size,
            left: 0,
            top: 0,
          }}
          resizeMode="contain"
        />
      </View>
    );
  },
);

function OrbitIcon({
  index,
  src,
  t,
  count,
  radius,
  orbitR,
  iconSize,
  slotStep,
  baseAngle,
}: {
  index: number;
  src: number;
  t: SharedValue<number>;
  count: number;
  radius: number;
  orbitR: number;
  iconSize: number;
  slotStep: number;
  baseAngle: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const cycle = ICON_HOLD + ICON_MOVE;
    const steps = Math.floor(t.value / cycle);
    const local = t.value % cycle;
    let spin = 0;
    if (local >= ICON_HOLD) {
      const p = Math.min(1, Math.max(0, (local - ICON_HOLD) / ICON_MOVE));
      spin = p * p * (3 - 2 * p);
    }
    const slot = ((index + steps) % count + count) % count;
    const angle = baseAngle + (slot + spin) * slotStep;
    const x = radius + orbitR * Math.cos(angle) - iconSize / 2;
    const y = radius + orbitR * Math.sin(angle) - iconSize / 2;
    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  });

  return (
    <Animated.Image
      source={src}
      style={[
        {
          position: "absolute",
          width: iconSize,
          height: iconSize,
          left: 0,
          top: 0,
        },
        animatedStyle,
      ]}
      resizeMode="contain"
    />
  );
}
