import { Logger } from "@mutualzz/logger";
import {
  addUserInteractionListener,
  type LiveActivity,
} from "expo-widgets";
import { Platform } from "react-native";
import VoiceChannelActivity, {
  VOICE_CHANNEL_LIVE_ACTIVITY_NAME,
  type VoiceChannelLiveActivityProps,
} from "../widgets/VoiceChannelLiveActivity";

type VoiceLiveActivityHandlers = {
  toggleMute: () => void;
  toggleDeaf: () => void;
  disconnect: () => void;
};

const logger = new Logger({ tag: "VoiceLiveActivity" });

let activity: LiveActivity<VoiceChannelLiveActivityProps> | null = null;
let handlers: VoiceLiveActivityHandlers | null = null;
let interactionBound = false;
let lastProps: VoiceChannelLiveActivityProps | null = null;

function resolveActiveActivity() {
  if (activity) return activity;

  const instances = VoiceChannelActivity.getInstances();
  if (instances.length === 0) return null;

  activity = instances[instances.length - 1] ?? null;
  return activity;
}

function isVoiceLiveActivityInteraction(source: string | undefined) {
  if (!source) return false;
  if (source === VOICE_CHANNEL_LIVE_ACTIVITY_NAME) return true;
  if (lastProps != null) return true;
  return VoiceChannelActivity.getInstances().length > 0;
}

function ensureInteractionListener() {
  if (interactionBound || Platform.OS !== "ios") return;
  interactionBound = true;

  addUserInteractionListener((event) => {
    if (!handlers) return;
    if (!isVoiceLiveActivityInteraction(event.source)) return;

    if (event.target === "mute") {
      const nextMuted = !(lastProps?.muted ?? false);
      if (lastProps) {
        void updateVoiceLiveActivity({
          ...lastProps,
          muted: nextMuted || (lastProps.deafened ?? false),
        });
      }
      handlers.toggleMute();
      return;
    }

    if (event.target === "deafen") {
      const nextDeafened = !(lastProps?.deafened ?? false);
      if (lastProps) {
        void updateVoiceLiveActivity({
          ...lastProps,
          deafened: nextDeafened,
          muted: nextDeafened ? true : lastProps.muted,
        });
      }
      handlers.toggleDeaf();
      return;
    }

    if (event.target === "disconnect") {
      handlers.disconnect();
    }
  });
}

export function bindVoiceLiveActivityHandlers(
  next: VoiceLiveActivityHandlers,
) {
  handlers = next;
  ensureInteractionListener();
}

export async function startOrUpdateVoiceLiveActivity(
  props: VoiceChannelLiveActivityProps,
  deepLinkUrl: string,
) {
  if (Platform.OS !== "ios") return;

  ensureInteractionListener();
  lastProps = props;

  try {
    const current = resolveActiveActivity();
    if (current) {
      await current.update(props);
      return;
    }

    activity = VoiceChannelActivity.start(props, deepLinkUrl);
  } catch (error) {
    logger.warn("Failed to start/update voice Live Activity", error);
    activity = null;
  }
}

export async function updateVoiceLiveActivity(
  props: VoiceChannelLiveActivityProps,
) {
  if (Platform.OS !== "ios") {
    lastProps = props;
    return;
  }

  lastProps = props;

  try {
    const current = resolveActiveActivity();
    if (!current) return;
    await current.update(props);
  } catch (error) {
    logger.warn("Failed to update voice Live Activity", error);
  }
}

export async function endVoiceLiveActivity() {
  if (Platform.OS !== "ios") {
    activity = null;
    lastProps = null;
    return;
  }

  const current = resolveActiveActivity();
  activity = null;
  lastProps = null;

  if (current) {
    try {
      await current.end("immediate");
    } catch (error) {
      logger.warn("Failed to end voice Live Activity", error);
    }
  }

  for (const instance of VoiceChannelActivity.getInstances()) {
    try {
      await instance.end("immediate");
    } catch {
    }
  }
}

export function getLastVoiceLiveActivityProps() {
  return lastProps;
}
