export type AppSound =
  | "message"
  | "user_join"
  | "user_leave"
  | "call_connect"
  | "call_disconnect"
  | "call_incoming"
  | "call_outgoing"
  | "call_decline"
  | "mute_on"
  | "mute_off"
  | "deafen_on"
  | "deafen_off"
  | "ptt_start"
  | "ptt_stop"
  | "stream_start"
  | "stream_stop";

export type SoundToggleId =
  | "message"
  | "call_incoming"
  | "call_outgoing"
  | "call_connect"
  | "call_disconnect"
  | "call_decline"
  | "user_join"
  | "user_leave"
  | "mute"
  | "deafen"
  | "ptt"
  | "stream";

export const SOUND_TOGGLE_IDS: SoundToggleId[] = [
  "message",
  "call_incoming",
  "call_outgoing",
  "call_connect",
  "call_disconnect",
  "call_decline",
  "user_join",
  "user_leave",
  "mute",
  "deafen",
  "ptt",
  "stream",
];

export const SOUND_TO_TOGGLE: Record<AppSound, SoundToggleId> = {
  message: "message",
  call_incoming: "call_incoming",
  call_outgoing: "call_outgoing",
  call_connect: "call_connect",
  call_disconnect: "call_disconnect",
  call_decline: "call_decline",
  user_join: "user_join",
  user_leave: "user_leave",
  mute_on: "mute",
  mute_off: "mute",
  deafen_on: "deafen",
  deafen_off: "deafen",
  ptt_start: "ptt",
  ptt_stop: "ptt",
  stream_start: "stream",
  stream_stop: "stream",
};

export const TOGGLE_PREVIEW_SOUND: Record<SoundToggleId, AppSound> = {
  message: "message",
  call_incoming: "call_incoming",
  call_outgoing: "call_outgoing",
  call_connect: "call_connect",
  call_disconnect: "call_disconnect",
  call_decline: "call_decline",
  user_join: "user_join",
  user_leave: "user_leave",
  mute: "mute_on",
  deafen: "deafen_on",
  ptt: "ptt_start",
  stream: "stream_start",
};

export function createDefaultSoundToggles(): Record<SoundToggleId, boolean> {
  return {
    message: true,
    call_incoming: true,
    call_outgoing: true,
    call_connect: true,
    call_disconnect: true,
    call_decline: true,
    user_join: true,
    user_leave: true,
    mute: true,
    deafen: true,
    ptt: true,
    stream: true,
  };
}
