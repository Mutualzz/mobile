import type * as mediasoupClient from "mediasoup-client";
import type { MediaStreamTrack } from "react-native-webrtc";

export type ProduceTrack = NonNullable<
  mediasoupClient.types.ProducerOptions["track"]
>;

export interface VoiceMediaDevice {
  deviceId: string;
  kind: string;
  label: string;
  groupId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function parseMediaDeviceList(value: unknown): VoiceMediaDevice[] {
  if (!Array.isArray(value)) return [];

  const devices: VoiceMediaDevice[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    if (typeof entry.deviceId !== "string" || typeof entry.kind !== "string") {
      continue;
    }

    devices.push({
      deviceId: entry.deviceId,
      kind: entry.kind,
      label: typeof entry.label === "string" ? entry.label : "",
      groupId: typeof entry.groupId === "string" ? entry.groupId : "",
    });
  }

  return devices;
}

export function assertUsableMediaTrack(
  track: MediaStreamTrack,
  expectedKind?: "audio" | "video",
): void {
  if (track.readyState === "ended") {
    throw new Error("Voice: cannot use an ended media track");
  }

  if (track.kind !== "audio" && track.kind !== "video") {
    throw new Error(`Voice: unsupported media track kind "${track.kind}"`);
  }

  if (expectedKind && track.kind !== expectedKind) {
    throw new Error(
      `Voice: expected ${expectedKind} track, received ${track.kind}`,
    );
  }
}

export function isNativeMediaStreamTrack(
  track: unknown,
): track is MediaStreamTrack {
  if (!isRecord(track)) return false;

  return (
    typeof track.id === "string" &&
    (track.kind === "audio" || track.kind === "video") &&
    typeof track.stop === "function" &&
    typeof track.enabled === "boolean"
  );
}

/**
 * mediasoup-client is typed against DOM WebRTC APIs. On React Native the same
 * runtime objects come from react-native-webrtc after registerGlobals().
 */
export function toProduceTrack(
  track: MediaStreamTrack,
  expectedKind: "audio" | "video",
): ProduceTrack {
  assertUsableMediaTrack(track, expectedKind);
  return track as unknown as ProduceTrack;
}

export function toNativeMediaStreamTrack(track: unknown): MediaStreamTrack {
  if (!isNativeMediaStreamTrack(track)) {
    throw new Error(
      "Voice: expected a react-native-webrtc MediaStreamTrack from consumer",
    );
  }

  assertUsableMediaTrack(track);
  return track;
}

export function hasSetVolume(
  track: MediaStreamTrack,
): track is MediaStreamTrack & { _setVolume(volume: number): void } {
  if (!("_setVolume" in track)) return false;
  const candidate = track as { _setVolume?: unknown };
  return typeof candidate._setVolume === "function";
}

export function iterateRtcStatsEntries(report: RTCStatsReport): unknown[] {
  if (report instanceof Map) {
    return Array.from(report.values());
  }

  if (isRecord(report)) {
    return Object.values(report);
  }

  return [];
}

export function readAudioLevelFromStats(
  report: RTCStatsReport,
): number | null {
  let best: number | null = null;

  for (const entry of iterateRtcStatsEntries(report)) {
    if (!isRecord(entry)) continue;

    const kind = entry.kind;
    const type = entry.type;
    if (kind !== "audio" && type !== "media-source") continue;

    const level = entry.audioLevel;
    if (typeof level !== "number" || !Number.isFinite(level)) continue;

    best = best == null ? level : Math.max(best, level);
  }

  return best;
}

export function parseVolumeMap(value: unknown): Array<[string, number]> {
  if (!isRecord(value)) return [];

  return Object.entries(value).flatMap(([userId, volume]) => {
    if (typeof volume !== "number" || !Number.isFinite(volume)) return [];
    return [[userId, volume] satisfies [string, number]];
  });
}

export function parseMutedUserIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export function createVoiceRpcId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Voice: invalid ${label}`);
  }
  return value;
}

function requireStringField(
  value: Record<string, unknown>,
  key: string,
  label: string,
): string {
  const field = value[key];
  if (typeof field !== "string" || field.length === 0) {
    throw new Error(`Voice: missing ${label}.${key}`);
  }
  return field;
}

export function parseRtpCapabilitiesResponse(
  value: unknown,
): mediasoupClient.types.RtpCapabilities {
  const data = requireRecord(value, "RTP capabilities response");
  if (!isRecord(data.rtpCapabilities)) {
    throw new Error("Voice: missing rtpCapabilities");
  }
  return data.rtpCapabilities as mediasoupClient.types.RtpCapabilities;
}

export function parseTransportOptionsResponse(
  value: unknown,
): mediasoupClient.types.TransportOptions {
  const data = requireRecord(value, "transport response");
  if (!isRecord(data.transportOptions)) {
    throw new Error("Voice: missing transportOptions");
  }
  return data.transportOptions as mediasoupClient.types.TransportOptions;
}

export function parseConsumerOptionsResponse(value: unknown): {
  consumerOptions: mediasoupClient.types.ConsumerOptions;
} {
  const data = requireRecord(value, "consumer response");
  if (!isRecord(data.consumerOptions)) {
    throw new Error("Voice: missing consumerOptions");
  }
  return {
    consumerOptions:
      data.consumerOptions as mediasoupClient.types.ConsumerOptions,
  };
}

export function parseProducerIdResponse(value: unknown): string {
  const data = requireRecord(value, "produce response");
  return requireStringField(data, "producerId", "produce response");
}

export function parseProducerClosedEvent(
  value: unknown,
): { producerId: string } | null {
  if (!isRecord(value)) return null;
  const producerId = value.producerId;
  if (typeof producerId !== "string" || producerId.length === 0) return null;
  return { producerId };
}

export function parseNewProducerEvent(value: unknown): {
  producerId: string;
  userId: string;
  mediaKind?: string;
} | null {
  if (!isRecord(value)) return null;

  const producerId = value.producerId;
  const userId = value.userId;
  if (typeof producerId !== "string" || producerId.length === 0) return null;
  if (typeof userId !== "string" || userId.length === 0) return null;

  return {
    producerId,
    userId,
    mediaKind:
      typeof value.mediaKind === "string" ? value.mediaKind : undefined,
  };
}
