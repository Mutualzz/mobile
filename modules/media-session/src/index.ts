import {
  requireOptionalNativeModule,
  type EventSubscription,
} from "expo-modules-core";

export type NowPlayingMedia = {
  trackKey: string;
  packageName: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  positionMs: number;
  startedAt: number;
};

type MediaChangedEvent = {
  media: NowPlayingMedia | null;
};

type MediaSessionNativeModule = {
  isAccessGranted(): boolean;
  openAccessSettings(): void;
  getCurrentMedia(): NowPlayingMedia | null;
  getArtwork(trackKey: string): Promise<string | null>;
  startWatching(): void;
  stopWatching(): void;
  addListener(
    eventName: "onMediaChanged",
    listener: (event: MediaChangedEvent) => void,
  ): EventSubscription;
};

const MediaSession =
  requireOptionalNativeModule<MediaSessionNativeModule>("MediaSession");

export const isMediaSessionSupported = MediaSession !== null;

export function isMediaAccessGranted() {
  return MediaSession?.isAccessGranted() ?? false;
}

export function openMediaAccessSettings() {
  MediaSession?.openAccessSettings();
}

export function getCurrentMedia() {
  return MediaSession?.getCurrentMedia() ?? null;
}

export async function getMediaArtwork(trackKey: string) {
  if (!MediaSession) return null;
  return MediaSession.getArtwork(trackKey);
}

export function startWatchingMedia() {
  MediaSession?.startWatching();
}

export function stopWatchingMedia() {
  MediaSession?.stopWatching();
}

export function addMediaChangedListener(
  listener: (media: NowPlayingMedia | null) => void,
): EventSubscription | null {
  if (!MediaSession) return null;
  return MediaSession.addListener("onMediaChanged", (event) =>
    listener(event.media),
  );
}
