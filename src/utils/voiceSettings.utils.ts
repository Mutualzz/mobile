export type VoiceInputMode = "voice_activity" | "push_to_talk";

export const DEFAULT_VOICE_INPUT_SENSITIVITY = 35;

export function sensitivityToThreshold(
  sensitivity: number,
  auto = false,
): number {
  if (auto) return 0.05;
  const clamped = Math.min(100, Math.max(0, sensitivity));
  return 0.01 + (clamped / 100) * 0.14;
}

export function clampUserVolume(volume: number) {
  return Math.min(200, Math.max(0, Math.round(volume)));
}

export function volumePercentToTrackGain(volume: number, muted: boolean) {
  if (muted) return 0;
  return Math.min(10, clampUserVolume(volume) / 100);
}
