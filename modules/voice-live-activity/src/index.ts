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
  backgroundColor: string;
};

type NativeModule = {
  areActivitiesEnabled(): boolean;
  isModuleAvailable(): boolean;
  writeWidgetSnapshot?(json: string): void;
  reloadWidgets?(): void;
  start(props: VoiceLiveActivityProps, deepLinkUrl: string): Promise<string>;
  update(props: VoiceLiveActivityProps): Promise<void>;
  end(): Promise<void>;
  addListener(
    eventName: "onVoiceLiveActivityAction" | "onWidgetAction",
    listener: (event: { action: string }) => void,
  ): EventSubscription;
  appGroupPath?: string;
};

function loadNativeModule(): NativeModule | null {
  if (Platform.OS !== "ios") return null;
  try {
    return requireOptionalNativeModule<NativeModule>("VoiceLiveActivity");
  } catch {
    return null;
  }
}

const native = loadNativeModule();

if (Platform.OS === "ios") {
  if (native == null) {
    console.warn(
      "[VoiceLiveActivity] Native module missing — this JS bundle needs a native binary built with modules/voice-live-activity (eas build / expo prebuild --clean && expo run:ios). OTA/Metro reload is not enough.",
    );
  } else {
    console.log("[VoiceLiveActivity] Native module linked");
  }
}

export function isVoiceLiveActivityModuleAvailable() {
  return native != null;
}

export function areVoiceLiveActivitiesEnabled() {
  if (!native) return false;
  try {
    return native.areActivitiesEnabled();
  } catch {
    return false;
  }
}

export function getVoiceLiveActivityAppGroupPath() {
  const path = native?.appGroupPath;
  return path && path.length > 0 ? path : null;
}

export async function startNativeVoiceLiveActivity(
  props: VoiceLiveActivityProps,
  deepLinkUrl: string,
) {
  if (!native) {
    throw new Error("VoiceLiveActivity native module is not linked");
  }
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

export function writeNativeWidgetSnapshot(json: string) {
  if (!native?.writeWidgetSnapshot) return;
  try {
    native.writeWidgetSnapshot(json);
  } catch {
    return;
  }
}

export function reloadNativeWidgets() {
  if (!native?.reloadWidgets) return;
  try {
    native.reloadWidgets();
  } catch {
    return;
  }
}

export function addWidgetActionListener(
  listener: (action: string) => void,
) {
  if (!native) {
    return { remove() {} };
  }

  return native.addListener("onWidgetAction", (event) => {
    if (typeof event.action === "string" && event.action.length > 0) {
      listener(event.action);
    }
  });
}
