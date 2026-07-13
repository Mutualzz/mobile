import { formatVoiceElapsed } from "@utils/voiceElapsed";
import { useEffect, useState } from "react";

export function useElapsedClock(
  startedAt: number | null | undefined
): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt == null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (startedAt == null) return null;
  return formatVoiceElapsed(now - startedAt);
}
