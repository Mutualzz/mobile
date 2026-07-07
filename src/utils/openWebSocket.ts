interface WebSocketOptions {
  headers?: Record<string, string>;
}

type ReactNativeWebSocket = new (
  uri: string,
  protocols?: string | string[] | null,
  options?: WebSocketOptions | null,
) => WebSocket;

export function openWebSocket(
  uri: string,
  options?: WebSocketOptions,
): WebSocket {
  const WebSocketCtor = WebSocket as unknown as ReactNativeWebSocket;
  return new WebSocketCtor(uri, undefined, options ?? null);
}
