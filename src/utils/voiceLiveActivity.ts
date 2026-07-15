import { Logger } from "@mutualzz/logger";
import { Platform } from "react-native";
import {
  addVoiceLiveActivityActionListener,
  areVoiceLiveActivitiesEnabled,
  endNativeVoiceLiveActivity,
  startNativeVoiceLiveActivity,
  updateNativeVoiceLiveActivity,
  type VoiceLiveActivityProps,
} from "voice-live-activity";

type VoiceLiveActivityHandlers = {
  toggleMute: () => void;
  toggleDeaf: () => void;
  disconnect: () => void;
};

const logger = new Logger({ tag: "VoiceLiveActivity" });

let handlers: VoiceLiveActivityHandlers | null = null;
let interactionBound = false;
let lastProps: VoiceLiveActivityProps | null = null;
let started = false;

function ensureInteractionListener() {
  if (interactionBound || Platform.OS !== "ios") return;
  interactionBound = true;

  addVoiceLiveActivityActionListener((action) => {
    if (!handlers) return;

    if (action === "mute") {
      handlers.toggleMute();
      return;
    }
    if (action === "deafen") {
      handlers.toggleDeaf();
      return;
    }
    if (action === "disconnect") {
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
  props: VoiceLiveActivityProps,
  deepLinkUrl: string,
) {
  if (Platform.OS !== "ios" || !areVoiceLiveActivitiesEnabled()) return;

  ensureInteractionListener();
  lastProps = props;

  try {
    if (started) {
      await updateNativeVoiceLiveActivity(props);
      return;
    }
    await startNativeVoiceLiveActivity(props, deepLinkUrl);
    started = true;
  } catch (error) {
    logger.warn("Failed to start/update voice Live Activity", error);
    started = false;
  }
}

export async function updateVoiceLiveActivity(props: VoiceLiveActivityProps) {
  if (Platform.OS !== "ios") {
    lastProps = props;
    return;
  }

  lastProps = props;
  if (!started || !areVoiceLiveActivitiesEnabled()) return;

  try {
    await updateNativeVoiceLiveActivity(props);
  } catch (error) {
    logger.warn("Failed to update voice Live Activity", error);
  }
}

export async function endVoiceLiveActivity() {
  lastProps = null;
  if (Platform.OS !== "ios") {
    started = false;
    return;
  }

  started = false;
  try {
    await endNativeVoiceLiveActivity();
  } catch (error) {
    logger.warn("Failed to end voice Live Activity", error);
  }
}

export function getLastVoiceLiveActivityProps() {
  return lastProps;
}
