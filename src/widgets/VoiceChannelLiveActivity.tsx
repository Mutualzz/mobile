import { HStack, Image, Link, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  aspectRatio,
  clipShape,
  font,
  foregroundStyle,
  frame,
  padding,
  resizable,
} from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity, type LiveActivityEnvironment } from "expo-widgets";

export const VOICE_CHANNEL_LIVE_ACTIVITY_NAME = "VoiceChannelActivity";

export const VOICE_LIVE_ACTIVITY_MUTE_URL =
  "com.mutualzz.app://voice-live-activity/mute";
export const VOICE_LIVE_ACTIVITY_DEAFEN_URL =
  "com.mutualzz.app://voice-live-activity/deafen";
export const VOICE_LIVE_ACTIVITY_DISCONNECT_URL =
  "com.mutualzz.app://voice-live-activity/disconnect";

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
  const muteColor =
    props.muted || props.deafened ? props.dangerColor : accentColor;
  const deafColor = props.deafened ? props.dangerColor : accentColor;
  const micIcon =
    props.muted || props.deafened ? "mic.slash.fill" : "mic.fill";
  const speakerIcon = props.deafened
    ? "speaker.slash.fill"
    : "speaker.wave.2.fill";
  const spaceTitle = props.spaceName.length > 0 ? props.spaceName : "Voice";
  const hasSpaceIcon = props.spaceIconPath.length > 0;
  const muteUrl = "com.mutualzz.app://voice-live-activity/mute";
  const deafenUrl = "com.mutualzz.app://voice-live-activity/deafen";
  const disconnectUrl = "com.mutualzz.app://voice-live-activity/disconnect";

  return {
    banner: (
      <HStack
        spacing={12}
        alignment="center"
        modifiers={[padding({ all: 12 })]}
      >
        <HStack spacing={10} alignment="center">
          {hasSpaceIcon ? (
            <Image
              uiImage={props.spaceIconPath}
              modifiers={[
                resizable(),
                aspectRatio({ contentMode: "fill" }),
                frame({ width: 36, height: 36 }),
                clipShape("circle"),
              ]}
            />
          ) : (
            <Image
              systemName="building.2.fill"
              color={accentColor}
              size={28}
            />
          )}
          <VStack spacing={2} alignment="leading">
            <Text
              modifiers={[
                font({ weight: "bold", size: 15 }),
                foregroundStyle(textColor),
              ]}
            >
              {spaceTitle}
            </Text>
            <Text
              modifiers={[
                font({ size: 12 }),
                foregroundStyle(mutedTextColor),
              ]}
            >
              {props.channelName}
            </Text>
          </VStack>
        </HStack>
        <Spacer />
        <HStack spacing={10} alignment="center">
          <Link destination={muteUrl}>
            <Image systemName={micIcon} color={muteColor} size={22} />
          </Link>
          <Link destination={deafenUrl}>
            <Image systemName={speakerIcon} color={deafColor} size={22} />
          </Link>
        </HStack>
      </HStack>
    ),
    compactLeading: hasSpaceIcon ? (
      <Image
        uiImage={props.spaceIconPath}
        modifiers={[
          resizable(),
          aspectRatio({ contentMode: "fill" }),
          frame({ width: 20, height: 20 }),
          clipShape("circle"),
        ]}
      />
    ) : (
      <Image systemName="building.2.fill" color={accentColor} />
    ),
    compactTrailing: (
      <HStack spacing={8} alignment="center">
        <Image systemName={micIcon} color={muteColor} size={18} />
        <Image systemName={speakerIcon} color={deafColor} size={18} />
      </HStack>
    ),
    minimal: hasSpaceIcon ? (
      <Image
        uiImage={props.spaceIconPath}
        modifiers={[
          resizable(),
          aspectRatio({ contentMode: "fill" }),
          frame({ width: 16, height: 16 }),
          clipShape("circle"),
        ]}
      />
    ) : (
      <Image systemName="building.2.fill" color={accentColor} />
    ),
    expandedLeading: (
      <HStack
        spacing={10}
        alignment="center"
        modifiers={[padding({ all: 10 })]}
      >
        {hasSpaceIcon ? (
          <Image
            uiImage={props.spaceIconPath}
            modifiers={[
              resizable(),
              aspectRatio({ contentMode: "fill" }),
              frame({ width: 36, height: 36 }),
              clipShape("circle"),
            ]}
          />
        ) : (
          <Image
            systemName="building.2.fill"
            color={accentColor}
            size={28}
          />
        )}
        <VStack spacing={2} alignment="leading">
          <Text
            modifiers={[
              font({ weight: "bold", size: 15 }),
              foregroundStyle(textColor),
            ]}
          >
            {spaceTitle}
          </Text>
          <Text
            modifiers={[font({ size: 12 }), foregroundStyle(mutedTextColor)]}
          >
            {props.channelName}
          </Text>
        </VStack>
      </HStack>
    ),
    expandedTrailing: (
      <HStack
        spacing={10}
        alignment="center"
        modifiers={[padding({ all: 10 })]}
      >
        <Link destination={muteUrl}>
          <Image systemName={micIcon} color={muteColor} size={22} />
        </Link>
        <Link destination={deafenUrl}>
          <Image systemName={speakerIcon} color={deafColor} size={22} />
        </Link>
      </HStack>
    ),
    expandedCenter: (
      <VStack>
        <Spacer />
      </VStack>
    ),
    expandedBottom: (
      <VStack
        spacing={8}
        alignment="center"
        modifiers={[padding({ all: 12 })]}
      >
        <Link destination={disconnectUrl}>
          <HStack spacing={8} alignment="center">
            <Image
              systemName="phone.down.fill"
              color={props.dangerColor}
              size={18}
            />
            <Text
              modifiers={[
                font({ weight: "bold", size: 16 }),
                foregroundStyle(props.dangerColor),
              ]}
            >
              Disconnect
            </Text>
          </HStack>
        </Link>
      </VStack>
    ),
  };
};

export default createLiveActivity(
  "VoiceChannelActivity",
  VoiceChannelActivityLayout,
);
