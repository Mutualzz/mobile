import { UserAvatar } from "@components/User/UserAvatar";
import { useTheme } from "@mutualzz/ui-native";
import type { APIUser } from "@mutualzz/types";
import type { AccountStore } from "@stores/Account.store";
import type { User } from "@stores/objects/User";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming
} from "react-native-reanimated";

type UserLike = AccountStore | User | APIUser;

interface Props {
  user?: UserLike | null;
  size?: number;
  pulsing?: boolean;
  dimmed?: boolean;
}

const RING_COUNT = 3;
const RING_DURATION = 1800;
const RING_STAGGER = 600;

const PulseRing = ({
  size,
  color,
  delay
}: {
  size: number;
  color: string;
  delay: number;
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: RING_DURATION,
          easing: Easing.out(Easing.cubic)
        }),
        -1,
        false
      )
    );
    return () => {
      cancelAnimation(progress);
    };
  }, [color, delay, progress, size]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.85 }],
    opacity: 0.7 * (1 - progress.value)
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: color
        },
        style
      ]}
    />
  );
};

export const CallRingingAvatar = observer(
  ({ user, size = 120, pulsing = true, dimmed }: Props) => {
    const { theme } = useTheme();
    const ringPad = Math.ceil(size * 0.55);
    const shouldDim = dimmed ?? pulsing;
    const ringColor = theme.colors.success;

    return (
      <View
        style={{
          width: size + ringPad * 2,
          height: size + ringPad * 2,
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible"
        }}
      >
        {pulsing &&
          Array.from({ length: RING_COUNT }, (_, i) => (
            <PulseRing
              key={`${ringColor}-${i}`}
              size={size}
              color={ringColor}
              delay={i * RING_STAGGER}
            />
          ))}
        <View
          style={{
            zIndex: 1,
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
            opacity: shouldDim ? 0.55 : 1,
            borderWidth: pulsing ? 3 : 0,
            borderColor: pulsing ? ringColor : "transparent"
          }}
        >
          <UserAvatar user={user ?? null} size={size} badge={false} />
        </View>
      </View>
    );
  }
);
