export function formatVoiceElapsed(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

export function getChannelOccupiedAt(
  states: Iterable<{ joinedAt?: number | null }>
): number | null {
  let min: number | null = null;
  for (const state of states) {
    const joinedAt = state.joinedAt;
    if (typeof joinedAt !== "number" || joinedAt <= 0) continue;
    if (min == null || joinedAt < min) min = joinedAt;
  }
  return min;
}
