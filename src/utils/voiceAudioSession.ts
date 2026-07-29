import { setAudioModeAsync } from "expo-audio";
import { Platform } from "react-native";

let voiceSessionActive = false;

export async function activateVoiceAudioSession() {
  if (Platform.OS === "android") {
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        allowsBackgroundRecording: true,
        interruptionMode: "doNotMix",
        shouldRouteThroughEarpiece: false,
      });
    } catch {
    // ignore
}
  }

  voiceSessionActive = true;
}

export async function deactivateVoiceAudioSession() {
  if (!voiceSessionActive) return;

  if (Platform.OS === "android") {
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
    // ignore
}
  }

  voiceSessionActive = false;
}
