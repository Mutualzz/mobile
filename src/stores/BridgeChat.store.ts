import { action, makeAutoObservable, observable } from "mobx";

export type BridgeFeedSource = "minecraft" | "discord" | "app";

export type BridgeLinkedUser = {
  id: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
};

export type BridgeFeedEntry = {
  id: string;
  bridgeId: string;
  serverId: string;
  source: BridgeFeedSource;
  kind: "chat" | "join" | "leave" | "voice_join" | "voice_leave";
  name: string;
  content?: string;
  uuid?: string;
  userId?: string;
  avatarUrl?: string;
  linkedUser?: BridgeLinkedUser | null;
  at: string;
  pending?: boolean;
  failed?: boolean;
};

export type BridgeOnlinePlayer = {
  uuid: string;
  name: string;
  serverId: string;
  linkedUser?: BridgeLinkedUser | null;
};

export type BridgeUnreadState = {
  lastMessageId: string | null;
  lastAckedId: string | null;
  unread: boolean;
};

type QueuedSend = {
  localId: string;
  bridgeId: string;
  content: string;
  attempts: number;
};

const MAX_PER_BRIDGE = 200;
const MAX_QUEUE_ATTEMPTS = 3;

const sortEntries = (entries: BridgeFeedEntry[]) =>
  [...entries].sort((a, b) => {
    const at = a.at.localeCompare(b.at);
    return at !== 0 ? at : a.id.localeCompare(b.id);
  });

export class BridgeChatStore {
  entriesByBridge = observable.map<string, BridgeFeedEntry[]>();
  playersByBridge = observable.map<string, BridgeOnlinePlayer[]>();
  unreadByBridge = observable.map<string, BridgeUnreadState>();
  spaceIdByBridge = observable.map<string, string>();
  sendQueue: QueuedSend[] = [];
  hasMoreByBridge = observable.map<string, boolean>();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  entriesFor(bridgeId: string): BridgeFeedEntry[] {
    return this.entriesByBridge.get(bridgeId) ?? [];
  }

  playersFor(bridgeId: string): BridgeOnlinePlayer[] {
    return this.playersByBridge.get(bridgeId) ?? [];
  }

  unreadFor(bridgeId: string): BridgeUnreadState | undefined {
    return this.unreadByBridge.get(bridgeId);
  }

  get hasAnyUnread(): boolean {
    for (const state of this.unreadByBridge.values()) {
      if (state.unread) return true;
    }
    return false;
  }

  hasUnreadForSpace(spaceId: string): boolean {
    for (const [bridgeId, bridgeSpaceId] of this.spaceIdByBridge) {
      if (
        bridgeSpaceId === spaceId &&
        this.unreadByBridge.get(bridgeId)?.unread
      ) {
        return true;
      }
    }
    return false;
  }

  hasMore(bridgeId: string): boolean {
    return this.hasMoreByBridge.get(bridgeId) ?? false;
  }

  add = action((entry: BridgeFeedEntry) => {
    const current = this.entriesByBridge.get(entry.bridgeId) ?? [];
    if (current.some((e) => e.id === entry.id)) return;
    const next = sortEntries([...current, entry]).slice(-MAX_PER_BRIDGE);
    this.entriesByBridge.set(entry.bridgeId, next);

    if (entry.kind === "join" && entry.uuid) {
      this.upsertPlayer(entry.bridgeId, {
        uuid: entry.uuid,
        name: entry.name,
        serverId: entry.serverId,
        linkedUser: entry.linkedUser,
      });
    }
    if (entry.kind === "leave" && entry.uuid) {
      this.removePlayer(entry.bridgeId, entry.uuid);
    }

    if (!entry.pending) {
      this.touchLastMessage(entry.bridgeId, entry.id);
    }
  });

  prepend = action((bridgeId: string, entries: BridgeFeedEntry[]) => {
    if (entries.length === 0) {
      this.hasMoreByBridge.set(bridgeId, false);
      return;
    }
    const current = this.entriesByBridge.get(bridgeId) ?? [];
    const byId = new Map<string, BridgeFeedEntry>();
    for (const entry of entries) byId.set(entry.id, entry);
    for (const entry of current) byId.set(entry.id, entry);
    this.entriesByBridge.set(
      bridgeId,
      sortEntries([...byId.values()]).slice(-MAX_PER_BRIDGE * 2),
    );
    this.hasMoreByBridge.set(bridgeId, entries.length >= 50);
  });

  hydrate = action((bridgeId: string, entries: BridgeFeedEntry[]) => {
    const current = this.entriesByBridge.get(bridgeId) ?? [];
    const byId = new Map<string, BridgeFeedEntry>();
    for (const entry of entries) byId.set(entry.id, entry);
    for (const entry of current) byId.set(entry.id, entry);
    this.entriesByBridge.set(
      bridgeId,
      sortEntries([...byId.values()]).slice(-MAX_PER_BRIDGE),
    );
    if (entries.length > 0) {
      this.hasMoreByBridge.set(bridgeId, entries.length >= 100);
    }
  });

  setPlayers = action((bridgeId: string, players: BridgeOnlinePlayer[]) => {
    this.playersByBridge.set(bridgeId, players);
  });

  upsertPlayer = action((bridgeId: string, player: BridgeOnlinePlayer) => {
    const current = this.playersByBridge.get(bridgeId) ?? [];
    const without = current.filter((p) => p.uuid !== player.uuid);
    this.playersByBridge.set(bridgeId, [...without, player]);
  });

  removePlayer = action((bridgeId: string, uuid: string) => {
    const current = this.playersByBridge.get(bridgeId) ?? [];
    this.playersByBridge.set(
      bridgeId,
      current.filter((p) => p.uuid !== uuid),
    );
  });

  setUnread = action((bridgeId: string, state: BridgeUnreadState) => {
    this.unreadByBridge.set(bridgeId, state);
  });

  setUnreadFromList = action(
    (
      bridges: {
        id: string;
        spaceId?: string;
        lastMessageId?: string | null;
        lastAckedId?: string | null;
        unread?: boolean;
      }[],
    ) => {
      for (const bridge of bridges) {
        this.unreadByBridge.set(bridge.id, {
          lastMessageId: bridge.lastMessageId ?? null,
          lastAckedId: bridge.lastAckedId ?? null,
          unread: Boolean(bridge.unread),
        });
        if (bridge.spaceId) {
          this.spaceIdByBridge.set(bridge.id, bridge.spaceId);
        }
      }
    },
  );

  markAcked = action((bridgeId: string, lastAckedId: string) => {
    const prev = this.unreadByBridge.get(bridgeId);
    this.unreadByBridge.set(bridgeId, {
      lastMessageId: prev?.lastMessageId ?? lastAckedId,
      lastAckedId,
      unread: false,
    });
  });

  touchLastMessage = action((bridgeId: string, messageId: string) => {
    const prev = this.unreadByBridge.get(bridgeId);
    const lastAckedId = prev?.lastAckedId ?? null;
    this.unreadByBridge.set(bridgeId, {
      lastMessageId: messageId,
      lastAckedId,
      unread: Boolean(messageId && messageId !== lastAckedId),
    });
  });

  enqueueSend = action((bridgeId: string, content: string): string => {
    const localId = `pending:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    this.sendQueue.push({ localId, bridgeId, content, attempts: 0 });
    this.add({
      id: localId,
      bridgeId,
      serverId: "",
      source: "app",
      kind: "chat",
      name: "You",
      content,
      at: new Date().toISOString(),
      pending: true,
    });
    return localId;
  });

  takeQueueFor = action((bridgeId: string) => {
    const mine = this.sendQueue.filter((q) => q.bridgeId === bridgeId);
    this.sendQueue = this.sendQueue.filter((q) => q.bridgeId !== bridgeId);
    return mine;
  });

  requeue = action((item: QueuedSend) => {
    if (item.attempts >= MAX_QUEUE_ATTEMPTS) {
      this.markFailed(item.localId, item.bridgeId);
      return false;
    }
    this.sendQueue.push({ ...item, attempts: item.attempts + 1 });
    return true;
  });

  resolvePending = action(
    (localId: string, bridgeId: string, entry: BridgeFeedEntry) => {
      const current = this.entriesByBridge.get(bridgeId) ?? [];
      const without = current.filter((e) => e.id !== localId);
      if (!without.some((e) => e.id === entry.id)) {
        without.push({ ...entry, pending: false, failed: false });
      }
      this.entriesByBridge.set(
        bridgeId,
        sortEntries(without).slice(-MAX_PER_BRIDGE),
      );
      this.touchLastMessage(bridgeId, entry.id);
    },
  );

  markFailed = action((localId: string, bridgeId: string) => {
    const current = this.entriesByBridge.get(bridgeId) ?? [];
    this.entriesByBridge.set(
      bridgeId,
      current.map((e) =>
        e.id === localId ? { ...e, pending: false, failed: true } : e,
      ),
    );
  });

  clear = action((bridgeId: string) => {
    this.entriesByBridge.delete(bridgeId);
    this.playersByBridge.delete(bridgeId);
    this.hasMoreByBridge.delete(bridgeId);
    this.unreadByBridge.delete(bridgeId);
    this.spaceIdByBridge.delete(bridgeId);
    this.sendQueue = this.sendQueue.filter((item) => item.bridgeId !== bridgeId);
  });

  clearAll = action(() => {
    this.entriesByBridge.clear();
    this.playersByBridge.clear();
    this.hasMoreByBridge.clear();
    this.unreadByBridge.clear();
    this.spaceIdByBridge.clear();
    this.sendQueue = [];
  });
}
