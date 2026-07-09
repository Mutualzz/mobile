import { volumePercentToTrackGain } from "@utils/voiceSettings.utils";
import type { MediaStreamTrack } from "react-native-webrtc";

import { hasSetVolume } from "./webrtcBridge";

export function setRemoteTrackVolume(
  track: MediaStreamTrack,
  volume: number,
  muted: boolean,
) {
  if (!hasSetVolume(track)) return;
  track._setVolume(volumePercentToTrackGain(volume, muted));
}
