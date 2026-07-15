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
};

const logger = new Logger({ tag: "VoiceLiveActivity" });

let activity: LiveActivity<VoiceChannelLiveActivityProps> | null = null;
let handlers: VoiceLiveActivityHandlers | null = null;
let interactionBound = false;
let lastProps: VoiceChannelLiveActivityProps | null = null;

function ensureInteractionListener() {
  if (interactionBound || Platform.OS !== "ios") return;
  interactionBound = true;

  addUserInteractionListener((event) => {
    if (event.source !== VOICE_CHANNEL_LIVE_ACTIVITY_NAME) return;
    if (!handlers) return;

    if (event.target === "mute") {
      handlers.toggleMute();
      return;
    }

    if (event.target === "deafen") {
      handlers.toggleDeaf();
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
    if (activity) {
      await activity.update(props);
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
  if (Platform.OS !== "ios" || !activity) {
    lastProps = props;
    return;
  }

  lastProps = props;

  try {
    await activity.update(props);
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

  const current = activity;
  activity = null;
  lastProps = null;

  if (!current) return;

  try {
    await current.end("immediate");
  } catch (error) {
    logger.warn("Failed to end voice Live Activity", error);
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
