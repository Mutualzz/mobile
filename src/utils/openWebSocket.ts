interface WebSocketOptions {
  headers?: Record<string, string>;
}

type ReactNativeWebSocket = new (
  uri: string,
  protocols?: string | string[] | null,
  options?: WebSocketOptions | null,
) => WebSocket;

/** Opens a WebSocket with React Native-only options (e.g. custom headers). */
export function openWebSocket(
  uri: string,
  options?: WebSocketOptions,
): WebSocket {
  const WebSocketCtor = WebSocket as unknown as ReactNativeWebSocket;
  return new WebSocketCtor(uri, undefined, options ?? null);
}
