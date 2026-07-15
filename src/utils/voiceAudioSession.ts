import { setAudioModeAsync } from "expo-audio";
import { Platform } from "react-native";
import { RTCAudioSession } from "react-native-webrtc";

let voiceSessionActive = false;

export async function activateVoiceAudioSession() {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    allowsBackgroundRecording: true,
    interruptionMode: "doNotMix",
    shouldRouteThroughEarpiece: false,
  });

  if (Platform.OS === "ios") {
    RTCAudioSession.audioSessionDidActivate();
  }

  voiceSessionActive = true;
}

export async function deactivateVoiceAudioSession() {
  if (!voiceSessionActive) return;

  if (Platform.OS === "ios") {
    try {
      RTCAudioSession.audioSessionDidDeactivate();
    } catch {
    }
  }

  try {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsBackgroundRecording: false,
      interruptionMode: "mixWithOthers",
      shouldRouteThroughEarpiece: false,
    });
  } catch {
  }

  voiceSessionActive = false;
}
