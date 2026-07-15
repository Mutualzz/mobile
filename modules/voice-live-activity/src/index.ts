import {
  requireOptionalNativeModule,
  type EventSubscription,
} from "expo-modules-core";
import { Platform } from "react-native";

export type VoiceLiveActivityProps = {
  channelName: string;
  spaceName: string;
  muted: boolean;
  deafened: boolean;
  spaceIconFileName: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  dangerColor: string;
};

type NativeModule = {
  areActivitiesEnabled(): boolean;
  start(props: VoiceLiveActivityProps, deepLinkUrl: string): Promise<string>;
  update(props: VoiceLiveActivityProps): Promise<void>;
  end(): Promise<void>;
  addListener(
    eventName: "onVoiceLiveActivityAction",
    listener: (event: { action: string }) => void,
  ): EventSubscription;
  appGroupPath?: string | null;
};

const native =
  Platform.OS === "ios"
    ? requireOptionalNativeModule<NativeModule>("VoiceLiveActivity")
    : null;

export function areVoiceLiveActivitiesEnabled() {
  if (!native) return false;
  try {
    return native.areActivitiesEnabled();
  } catch {
    return false;
  }
}

export function getVoiceLiveActivityAppGroupPath() {
  return native?.appGroupPath ?? null;
}

export async function startNativeVoiceLiveActivity(
  props: VoiceLiveActivityProps,
  deepLinkUrl: string,
) {
  if (!native) return null;
  return native.start(props, deepLinkUrl);
}

export async function updateNativeVoiceLiveActivity(
  props: VoiceLiveActivityProps,
) {
  if (!native) return;
  await native.update(props);
}

export async function endNativeVoiceLiveActivity() {
  if (!native) return;
  await native.end();
}

export function addVoiceLiveActivityActionListener(
  listener: (action: "mute" | "deafen" | "disconnect") => void,
) {
  if (!native) {
    return { remove() {} };
  }

  return native.addListener("onVoiceLiveActivityAction", (event) => {
    if (
      event.action === "mute" ||
      event.action === "deafen" ||
      event.action === "disconnect"
    ) {
      listener(event.action);
    }
  });
}
