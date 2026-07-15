import { Button, HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  clipShape,
  controlSize,
  font,
  foregroundStyle,
  frame,
  padding,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity, type LiveActivityEnvironment } from "expo-widgets";

export const VOICE_CHANNEL_LIVE_ACTIVITY_NAME = "VoiceChannelActivity";

export interface VoiceChannelLiveActivityProps {
  channelName: string;
  spaceName: string;
  muted: boolean;
  deafened: boolean;
  spaceIconPath: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  dangerColor: string;
  successColor: string;
}

function SpaceIdentity(props: {
  spaceIconPath: string;
  spaceName: string;
  channelName: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
}) {
  "widget";

  const hasIcon = props.spaceIconPath.length > 0;

  return (
    <HStack spacing={10} alignment="center">
      {hasIcon ? (
        <Image
          uiImage={props.spaceIconPath}
          modifiers={[
            frame({ width: 36, height: 36 }),
            clipShape("circle"),
          ]}
        />
      ) : (
        <Image
          systemName="building.2.fill"
          color={props.accentColor}
          size={28}
        />
      )}
      <VStack spacing={2} alignment="leading">
        <Text
          modifiers={[
            font({ weight: "bold", size: 15 }),
            foregroundStyle(props.textColor),
          ]}
        >
          {props.spaceName.length > 0 ? props.spaceName : "Voice"}
        </Text>
        <Text
          modifiers={[font({ size: 12 }), foregroundStyle(props.mutedTextColor)]}
        >
          {props.channelName}
        </Text>
      </VStack>
    </HStack>
  );
}

function MuteDeafenIcons(props: {
  muted: boolean;
  deafened: boolean;
  dangerColor: string;
  accentColor: string;
  interactive: boolean;
}) {
  "widget";

  const muteColor =
    props.muted || props.deafened ? props.dangerColor : props.accentColor;
  const deafColor = props.deafened ? props.dangerColor : props.accentColor;
  const micIcon =
    props.muted || props.deafened ? "mic.slash.fill" : "mic.fill";
  const speakerIcon = props.deafened
    ? "speaker.slash.fill"
    : "speaker.wave.2.fill";

  if (!props.interactive) {
    return (
      <HStack spacing={8} alignment="center">
        <Image systemName={micIcon} color={muteColor} size={18} />
        <Image systemName={speakerIcon} color={deafColor} size={18} />
      </HStack>
    );
  }

  return (
    <HStack spacing={4} alignment="center">
      <Button
        target="mute"
        modifiers={[buttonStyle("plain"), tint(muteColor)]}
      >
        <Image systemName={micIcon} color={muteColor} size={20} />
      </Button>
      <Button
        target="deafen"
        modifiers={[buttonStyle("plain"), tint(deafColor)]}
      >
        <Image systemName={speakerIcon} color={deafColor} size={20} />
      </Button>
    </HStack>
  );
}

const VoiceChannelActivityLayout = (
  props: VoiceChannelLiveActivityProps,
  environment: LiveActivityEnvironment,
) => {
  "widget";

  const accentColor = environment.isLuminanceReduced
    ? "#FFFFFF"
    : props.accentColor;
  const textColor = environment.isLuminanceReduced
    ? "#FFFFFF"
    : props.textColor;
  const mutedTextColor = environment.isLuminanceReduced
    ? "#DDDDDD"
    : props.mutedTextColor;
  const micIcon =
    props.muted || props.deafened ? "mic.slash.fill" : "mic.fill";

  const identity = (
    <SpaceIdentity
      spaceIconPath={props.spaceIconPath}
      spaceName={props.spaceName}
      channelName={props.channelName}
      accentColor={accentColor}
      textColor={textColor}
      mutedTextColor={mutedTextColor}
    />
  );

  const controls = (
    <MuteDeafenIcons
      muted={props.muted}
      deafened={props.deafened}
      dangerColor={props.dangerColor}
      accentColor={accentColor}
      interactive
    />
  );

  const statusIcons = (
    <MuteDeafenIcons
      muted={props.muted}
      deafened={props.deafened}
      dangerColor={props.dangerColor}
      accentColor={accentColor}
      interactive={false}
    />
  );

  return {
    banner: (
      <HStack
        spacing={12}
        alignment="center"
        modifiers={[padding({ all: 12 })]}
      >
        {identity}
        <Spacer />
        {controls}
      </HStack>
    ),
    compactLeading: <Image systemName={micIcon} color={accentColor} />,
    compactTrailing: statusIcons,
    minimal: <Image systemName={micIcon} color={accentColor} />,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 10 })]}>{identity}</VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 10 })]}>{controls}</VStack>
    ),
    expandedCenter: (
      <VStack>
        <Spacer />
      </VStack>
    ),
    expandedBottom: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Button
          label="Disconnect"
          target="disconnect"
          role="destructive"
          systemImage="phone.down.fill"
          modifiers={[
            buttonStyle("borderedProminent"),
            controlSize("large"),
            tint(props.dangerColor),
          ]}
        />
      </VStack>
    ),
  };
};

export default createLiveActivity(
  VOICE_CHANNEL_LIVE_ACTIVITY_NAME,
  VoiceChannelActivityLayout,
);
