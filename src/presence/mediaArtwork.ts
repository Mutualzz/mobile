import { getMediaArtwork } from "media-session";

let cachedArtworkUrl: { trackKey: string; url: string | null } | null = null;
let pendingTrackKey: string | null = null;

export function resolveMediaArtworkUrl(
  trackKey: string,
  upload: (image: string) => Promise<string | null>,
  onResolved: () => void,
): string | null {
  if (cachedArtworkUrl?.trackKey === trackKey) return cachedArtworkUrl.url;
  if (pendingTrackKey === trackKey) return null;

  pendingTrackKey = trackKey;

  void (async () => {
    const image = await getMediaArtwork(trackKey);
    if (!image) return;

    const url = await upload(image);
    cachedArtworkUrl = { trackKey, url };
    if (url) onResolved();
  })()
    .catch(() => undefined)
    .finally(() => {
      if (pendingTrackKey === trackKey) pendingTrackKey = null;
    });

  return null;
}
