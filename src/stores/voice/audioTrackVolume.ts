import { volumePercentToTrackGain } from "@utils/voiceSettings.utils";
import type * as mediasoupClient from "mediasoup-client";
import type { MediaStreamTrack } from "react-native-webrtc";

import { hasSetVolume, toNativeMediaStreamTrack } from "./webrtcBridge";

export function setRemoteTrackVolume(
  track: MediaStreamTrack,
  volume: number,
  muted: boolean,
) {
  if (!hasSetVolume(track)) return;
  track._setVolume(volumePercentToTrackGain(volume, muted));
}

export function setConsumerAudioMix(
  consumer: mediasoupClient.types.Consumer,
  volume: number,
  muted: boolean,
) {
  try {
    const track = toNativeMediaStreamTrack(consumer.track);
    if (hasSetVolume(track)) {
      setRemoteTrackVolume(track, volume, muted);
      return;
    }
  } catch {
    // Fall back to transport mute only below.
  }

  try {
    if (muted) consumer.pause();
    else consumer.resume();
  } catch {
    // Avoid toggling consumer.track.enabled — it can crash on native WebRTC.
  }
}
