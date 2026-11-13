import type { PresenceActivity } from "@mutualzz/types";
import type { NowPlayingMedia } from "media-session";

export interface MediaApp {
  name: string;
  applicationId: string;
  packageNames: string[];
}

export const MEDIA_APPS: MediaApp[] = [
  {
    name: "Spotify",
    applicationId: "spotify",
    packageNames: ["com.spotify.music"],
  },
  {
    name: "Apple Music",
    applicationId: "apple-music",
    packageNames: ["com.apple.android.music"],
  },
  { name: "TIDAL", applicationId: "tidal", packageNames: ["com.aspiro.tidal"] },
  {
    name: "Deezer",
    applicationId: "deezer",
    packageNames: ["deezer.android.app"],
  },
  {
    name: "Amazon Music",
    applicationId: "amazon-music",
    packageNames: ["com.amazon.mp3"],
  },
  {
    name: "YouTube Music",
    applicationId: "youtube-music",
    packageNames: ["com.google.android.apps.youtube.music"],
  },
];

const loggedUnknownPackages = new Set<string>();

export function findMediaApp(packageName: string) {
  const mediaApp = MEDIA_APPS.find((candidate) =>
    candidate.packageNames.includes(packageName),
  );

  if (!mediaApp && !loggedUnknownPackages.has(packageName)) {
    loggedUnknownPackages.add(packageName);
    console.debug("[Media] ignoring unknown package", packageName);
  }

  return mediaApp ?? null;
}

export function buildListeningActivity(
  media: NowPlayingMedia,
  options: {
    disabledMusicApps: string[];
    syncLyrics: boolean;
    resolveArtwork: (trackKey: string) => string | null;
  },
): PresenceActivity | null {
  const mediaApp = findMediaApp(media.packageName);
  if (!mediaApp || options.disabledMusicApps.includes(mediaApp.applicationId)) {
    return null;
  }

  const artworkUrl = options.resolveArtwork(media.trackKey);

  return {
    type: "listening",
    name: mediaApp.name,
    applicationId: mediaApp.applicationId,
    details: media.title,
    state: media.artist,
    assets: artworkUrl ? { largeImageUrl: artworkUrl } : {},
    ...(options.syncLyrics ? { syncLyrics: true } : {}),
    timestamps:
      media.durationMs > 0
        ? {
            start: media.startedAt,
            end: media.startedAt + media.durationMs,
          }
        : { start: media.startedAt },
  };
}
