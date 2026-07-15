import * as Linking from "expo-linking";
import { Platform } from "react-native";
import {
  VOICE_LIVE_ACTIVITY_DEAFEN_URL,
  VOICE_LIVE_ACTIVITY_DISCONNECT_URL,
  VOICE_LIVE_ACTIVITY_MUTE_URL,
} from "../widgets/VoiceChannelLiveActivity";
import {
  getLastVoiceLiveActivityProps,
  updateVoiceLiveActivity,
} from "./voiceLiveActivity";

type VoiceLiveActivityLinkHandlers = {
  toggleMute: () => void;
  toggleDeaf: () => void;
  disconnect: () => void;
};

let handlers: VoiceLiveActivityLinkHandlers | null = null;
let linkingBound = false;

function parseVoiceLiveActivityAction(url: string) {
  const normalized = url.trim().toLowerCase();
  if (
    normalized === VOICE_LIVE_ACTIVITY_MUTE_URL.toLowerCase() ||
    normalized.includes("voice-live-activity/mute")
  ) {
    return "mute" as const;
  }
  if (
    normalized === VOICE_LIVE_ACTIVITY_DEAFEN_URL.toLowerCase() ||
    normalized.includes("voice-live-activity/deafen")
  ) {
    return "deafen" as const;
  }
  if (
    normalized === VOICE_LIVE_ACTIVITY_DISCONNECT_URL.toLowerCase() ||
    normalized.includes("voice-live-activity/disconnect")
  ) {
    return "disconnect" as const;
  }
  return null;
}

function handleVoiceLiveActivityUrl(url: string) {
  if (!handlers) return false;

  const action = parseVoiceLiveActivityAction(url);
  if (!action) return false;

  const lastProps = getLastVoiceLiveActivityProps();

  if (action === "mute") {
    if (lastProps) {
      const nextMuted = !lastProps.muted;
      void updateVoiceLiveActivity({
        ...lastProps,
        muted: nextMuted || lastProps.deafened,
      });
    }
    handlers.toggleMute();
    return true;
  }

  if (action === "deafen") {
    if (lastProps) {
      const nextDeafened = !lastProps.deafened;
      void updateVoiceLiveActivity({
        ...lastProps,
        deafened: nextDeafened,
        muted: nextDeafened ? true : lastProps.muted,
      });
    }
    handlers.toggleDeaf();
    return true;
  }

  handlers.disconnect();
  return true;
}

export function bindVoiceLiveActivityLinkHandlers(
  next: VoiceLiveActivityLinkHandlers,
) {
  handlers = next;
  if (linkingBound || Platform.OS !== "ios") return;
  linkingBound = true;

  void Linking.getInitialURL().then((url) => {
    if (url) handleVoiceLiveActivityUrl(url);
  });

  Linking.addEventListener("url", ({ url }) => {
    handleVoiceLiveActivityUrl(url);
  });
}

export function isVoiceLiveActivityUrl(url: string) {
  return parseVoiceLiveActivityAction(url) != null;
}
