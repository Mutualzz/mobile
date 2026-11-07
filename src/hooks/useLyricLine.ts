import { useAppStore } from "@hooks/useStores";
import { currentLyric, getLyricsTrack, lyricsQueryKey } from "@mutualzz/client";
import type { PresenceActivity } from "@mutualzz/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const MIN_TIMER_MS = 50;

export function useLyricLine(activity: PresenceActivity | null | undefined) {
  const app = useAppStore();
  const track = getLyricsTrack(activity);

  const { data: lyrics } = useQuery({
    queryKey: track ? lyricsQueryKey(track) : ["lyrics", "none"],
    queryFn: async () => {
      const result = await app.gateway.requestLyrics(
        track!.trackName,
        track!.artistName,
        track!.durationMs,
      );
      if (!result) throw new Error("Lyrics unavailable");
      return result;
    },
    enabled: track !== null,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: false,
    retryOnMount: false,
  });

  const lines = track ? (lyrics?.lines ?? null) : null;
  const startedAt = track?.startedAt;
  const [lineText, setLineText] = useState<string | null>(null);

  useEffect(() => {
    if (!lines || startedAt === undefined) {
      setLineText(null);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const update = () => {
      const { text, nextInMs } = currentLyric(lines, Date.now() - startedAt);
      setLineText(text);
      if (nextInMs !== null) {
        timer = setTimeout(update, Math.max(MIN_TIMER_MS, nextInMs));
      }
    };

    update();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [lines, startedAt]);

  return lineText;
}
