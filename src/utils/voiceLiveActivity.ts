import { Logger } from "@mutualzz/logger";
import { Platform } from "react-native";
import {
  addVoiceLiveActivityActionListener,
  areVoiceLiveActivitiesEnabled,
  endNativeVoiceLiveActivity,
  isVoiceLiveActivityModuleAvailable,
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
let activityId: string | null = null;

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
  if (Platform.OS !== "ios") return;

  ensureInteractionListener();
  lastProps = props;

  if (
    typeof isVoiceLiveActivityModuleAvailable !== "function" ||
    !isVoiceLiveActivityModuleAvailable()
  ) {
    console.warn(
      "[VoiceLiveActivity] Native module not linked — need a new native iOS build that includes voice-live-activity (not Metro reload / EAS Update)",
    );
    logger.warn(
      "Native module not linked — rebuild native iOS with modules/voice-live-activity",
    );
    return;
  }

  if (!areVoiceLiveActivitiesEnabled()) {
    console.warn(
      "[VoiceLiveActivity] Live Activities disabled — Settings → Mutualzz → Live Activities",
    );
    logger.warn(
      "Live Activities are disabled for this device/app (Settings → Mutualzz / Live Activities)",
    );
  }

  try {
    if (started && activityId) {
      await updateNativeVoiceLiveActivity(props);
      return;
    }

    activityId = await startNativeVoiceLiveActivity(props, deepLinkUrl);
    started = !!activityId;
    if (!activityId) {
      console.warn("[VoiceLiveActivity] start() returned empty activity id");
      logger.warn("start() returned empty activity id");
      started = false;
    } else {
      console.log(`[VoiceLiveActivity] Started activity ${activityId}`);
      logger.info(`Started activity ${activityId}`);
    }
  } catch (error) {
    console.warn("[VoiceLiveActivity] Failed to start/update", error);
    logger.warn("Failed to start/update voice Live Activity", error);
    started = false;
    activityId = null;
  }
}

export async function updateVoiceLiveActivity(props: VoiceLiveActivityProps) {
  if (Platform.OS !== "ios") {
    lastProps = props;
    return;
  }

  lastProps = props;
  if (!started || !isVoiceLiveActivityModuleAvailable()) return;

  try {
    await updateNativeVoiceLiveActivity(props);
  } catch (error) {
    console.warn("[VoiceLiveActivity] Failed to update", error);
    logger.warn("Failed to update voice Live Activity", error);
  }
}

export async function endVoiceLiveActivity() {
  lastProps = null;
  activityId = null;
  if (Platform.OS !== "ios") {
    started = false;
    return;
  }

  started = false;
  if (!isVoiceLiveActivityModuleAvailable()) return;

  try {
    await endNativeVoiceLiveActivity();
  } catch (error) {
    console.warn("[VoiceLiveActivity] Failed to end", error);
    logger.warn("Failed to end voice Live Activity", error);
  }
}

export function getLastVoiceLiveActivityProps() {
  return lastProps;
}
