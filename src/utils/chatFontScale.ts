let scale = 1;
const listeners = new Set<() => void>();

export function getChatFontScale() {
  return scale;
}

export function applyChatFontScale(next: number) {
  if (scale === next) return;
  scale = next;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeChatFontScale(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
