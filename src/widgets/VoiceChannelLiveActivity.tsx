import {
  Button,
  HStack,
  Image,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import {
  createLiveActivity,
  type LiveActivityEnvironment,
} from "expo-widgets";

export const VOICE_CHANNEL_LIVE_ACTIVITY_NAME = "VoiceChannelActivity";

export type VoiceChannelLiveActivityProps = {
  channelName: string;
  spaceName: string;
  muted: boolean;
  deafened: boolean;
};

const VoiceChannelActivityLayout = (
  props: VoiceChannelLiveActivityProps,
  environment: LiveActivityEnvironment,
) => {
  "widget";

  const accentColor = environment.isLuminanceReduced ? "#FFFFFF" : "#B57EDC";
  const statusLabel = props.deafened
    ? "Deafened"
    : props.muted
      ? "Muted"
      : "Connected";
  const micIcon = props.muted || props.deafened ? "mic.slash.fill" : "mic.fill";
  const headphoneIcon = props.deafened
    ? "headphones"
    : "speaker.wave.2.fill";
  const muteLabel = props.muted || props.deafened ? "Unmute" : "Mute";
  const deafenLabel = props.deafened ? "Undeafen" : "Deafen";
  const title =
    props.spaceName.length > 0
      ? `${props.channelName} / ${props.spaceName}`
      : props.channelName;

  const controls = (
    <HStack modifiers={[padding({ top: 8 })]}>
      <Button label={muteLabel} target="mute" systemImage={micIcon} />
      <Button
        label={deafenLabel}
        target="deafen"
        systemImage={headphoneIcon}
      />
    </HStack>
  );

  return {
    banner: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text
          modifiers={[font({ weight: "bold" }), foregroundStyle(accentColor)]}
        >
          {title}
        </Text>
        <Text modifiers={[font({ size: 13 }), foregroundStyle("#E8E0F0")]}>
          {statusLabel}
        </Text>
        {controls}
      </VStack>
    ),
    compactLeading: <Image systemName={micIcon} color={accentColor} />,
    compactTrailing: (
      <Text modifiers={[font({ size: 12 }), foregroundStyle(accentColor)]}>
        {statusLabel}
      </Text>
    ),
    minimal: <Image systemName={micIcon} color={accentColor} />,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 10 })]}>
        <Image systemName={micIcon} color={accentColor} />
        <Text modifiers={[font({ size: 11 })]}>{statusLabel}</Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 10 })]}>
        <Image systemName={headphoneIcon} color={accentColor} />
        <Text modifiers={[font({ size: 11 })]}>
          {props.deafened ? "Deaf" : "Voice"}
        </Text>
      </VStack>
    ),
    expandedCenter: (
      <VStack>
        <Text modifiers={[font({ weight: "bold", size: 15 })]}>
          {props.channelName}
        </Text>
        <Text modifiers={[font({ size: 12 })]}>
          {props.spaceName.length > 0 ? props.spaceName : "Voice"}
        </Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack modifiers={[padding({ all: 10 })]}>{controls}</VStack>
    ),
  };
};

export default createLiveActivity(
  VOICE_CHANNEL_LIVE_ACTIVITY_NAME,
  VoiceChannelActivityLayout,
);
