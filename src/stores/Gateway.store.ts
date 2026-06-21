import { Logger } from "@mutualzz/logger";
import type {
  APIMessage,
  APIMessageReactionEvent,
  APIMessageReactionRemoveAllEvent,
  APIMessageReactionRemoveEmojiEvent,
  APIMessageReactionRemoveEvent,
  APIExpression,
  GatewayReadyPayload,
} from "@mutualzz/types";
import {
  type APIChannel,
  type APIInvite,
  type APIMemberRole,
  type APIPrivateUser,
  type APIRole,
  type APIRelationship,
  type APISpace,
  type APIUser,
  type APIUserProfile,
  type APIUserSettings,
  GatewayCloseCodes,
  GatewayDispatchEvents,
  GatewayOpcodes,
  ChannelType,
  type Snowflake,
  type PresenceActivityEmoji,
  type PresenceStatus,
  type CustomStatusSchedule,
  type PresenceSchedule,
  type PresencePayload,
} from "@mutualzz/types";
import { type Codec, createCodec, type Encoding } from "@utils/codec";
import {
  type Compression,
  type Compressor,
  createCompressor,
} from "@utils/compressor";
import { makeAutoObservable } from "mobx";
import type { AppStore } from "./App.store";
import type { Channel } from "./objects/Channel";
import { fixConnectionUrl } from "@utils/urls";
import { openWebSocket } from "@utils/openWebSocket"; // We have to create our own GatewayStatus "enum" to avoid issues with SSR

// We have to create our own GatewayStatus "enum" to avoid issues with SSR
// since WebSocket is not available in the server environment.
// If someone has a better solution, please let me know. lol
export const GatewayStatus = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export type GatewayStatus = (typeof GatewayStatus)[keyof typeof GatewayStatus];

const RECONNECT_TIMEOUT = 5000;

type Timer = ReturnType<typeof setTimeout>;

interface PresenceUpdateDraft {
  status: PresenceStatus;
  device: "mobile" | "web" | "desktop";
  activities?: PresencePayload["activities"];
}

export class GatewayStore {
  socket: WebSocket | null = null;
  public readyState: GatewayStatus = GatewayStatus.CLOSED;
  public events: { t: string; d: any; s: number }[] = [];
  private readonly logger = new Logger({
    tag: "GatewayStore",
  });
  private sessionId: string | null = null;
  private sequence = 0;
  private heartbeatInterval: number | null = null;
  private heartbeater: Timer | null = null;
  private initialHeartbeatTimeout: Timer | null = null;
  private heartbeatAck = true;
  private url?: string;
  private encoding: Encoding = "json";
  private compress: Compression = "zlib-stream";
  private codec!: Codec;
  private compressor!: Compressor;
  private connectionStartTime?: number;
  private identifyStartTime?: number;
  private reconnectTimeout = 0;
  private reconnecting = false;
  private readonly dispatchHandlers = new Map<
    string,
    (...args: any[]) => any
  >();

  private lazyRequestChannels = new Map<string, string[]>(); // spaceId -> channelIds
  private memberListRanges = new Map<string, [number, number][]>();
  private memberListFetching = new Set<string>();
  private resolvingChannels = new Map<
    Snowflake,
    Promise<Channel | undefined>
  >();
  private subscribedUserIds = new Set<string>();
  private presenceLoopInterval: Timer | null = null;
  private lastPresenceHash: string | null = null;

  constructor(private readonly app: AppStore) {
    makeAutoObservable(this);
    this.app.customStatus.onScheduledCustomStatusExpire =
      this.handleScheduledCustomStatusExpired;
    this.app.presence.onScheduledStatusExpire =
      this.handleScheduledStatusExpired;
  }

  requestMemberListRange(spaceId: string, channelId: string, pageSize = 50) {
    if (!spaceId || !channelId) return;

    const key = `${spaceId}:${channelId}`;
    if (this.memberListFetching.has(key)) return;

    let loadedCount: number;
    try {
      const space = this.app.spaces.get(spaceId);
      const channel = this.app.channels.get(channelId);
      const listStore =
        space && channel ? space.memberLists.get(channel.listId) : null;

      if (listStore)
        loadedCount = listStore.list.reduce(
          (acc: number, g: any) => acc + (g.items?.length ?? 0),
          0,
        );
      else {
        const prevRanges = this.memberListRanges.get(key) ?? [];
        loadedCount = prevRanges.reduce((acc, r) => acc + (r[1] - r[0] + 1), 0);
      }
    } catch {
      loadedCount = 0;
    }

    const nextStart = loadedCount;
    const nextEnd = Math.max(nextStart, nextStart + pageSize - 1);

    if (nextEnd < nextStart) return;

    const prev = this.memberListRanges.get(key) ?? [];

    for (const r of prev) {
      if (r[0] <= nextStart && r[1] >= nextStart) return;
    }

    const newRanges = [...prev, [nextStart, nextEnd]];
    this.memberListRanges.set(key, newRanges as [number, number][]);

    this.memberListFetching.add(key);

    const payload = {
      spaceId,
      channels: {
        [channelId]: newRanges,
      },
    };

    try {
      this.send({
        op: GatewayOpcodes.LazyRequest,
        d: payload,
      });
    } finally {
      setTimeout(() => this.memberListFetching.delete(key), 250);
    }
  }

  private resolveChannel(channelId: Snowflake): Promise<Channel | undefined> {
    const existing = this.app.channels.get(channelId);
    if (existing) return Promise.resolve(existing);

    if (this.resolvingChannels.has(channelId))
      return this.resolvingChannels.get(channelId)!;

    const promise = this.app.channels
      .resolve(channelId)
      .finally(() => this.resolvingChannels.delete(channelId));

    this.resolvingChannels.set(channelId, promise);
    return promise;
  }

  async connect(_url?: string) {
    const url = fixConnectionUrl(_url || process.env.EXPO_PUBLIC_WS_URL || "");

    if (!url) {
      this.logger.error("Websocket URL is not defined");
      return;
    }

    if (!this.url) {
      const newUrl = new URL(url);
      newUrl.searchParams.set("encoding", this.encoding);
      newUrl.searchParams.set("compress", this.compress);
      this.url = newUrl.href;
    }

    this.logger.debug(`[Connect] Gateway URL ${this.url}`);
    this.connectionStartTime = Date.now();
    this.socket = openWebSocket(this.url, {
      headers: {
        "User-Agent": "Mutualzz-Mobile/1.0",
      },
    });
    this.socket.binaryType = "arraybuffer";
    this.readyState = GatewayStatus.CONNECTING;

    this.codec = await createCodec(this.encoding);
    this.compressor = await createCompressor(this.compress);

    this.setupListeners();
    this.setupDispatchHandlers();
  }

  async disconnect(code?: number, reason?: string) {
    if (!this.socket) return;

    this.readyState = GatewayStatus.CLOSING;
    this.logger.debug(`[Disconnect] ${this.url}`);
    this.socket.close(code, reason);
  }

  startReconnect() {
    if (this.reconnecting) return;

    this.reconnecting = true;
    setTimeout(() => {
      this.reconnecting = false;
      this.logger.debug(`[Reconnect] ${this.url}`);
      this.connect(this.url);
    }, this.reconnectTimeout);
  }

  onChannelOpen = (spaceId: string, channelId: string) => {
    const spaceChannels = this.lazyRequestChannels.get(spaceId) || [];

    if (spaceChannels.includes(channelId)) return;

    const payload = {
      spaceId,
      channels: {
        [channelId]: [[0, 99]],
      },
    };
    this.lazyRequestChannels.set(spaceId, [channelId]);

    this.send({
      op: GatewayOpcodes.LazyRequest,
      d: payload,
    });
  };

  subscribeUser(userId: string) {
    this.subscribedUserIds.add(userId);
    if (this.readyState !== GatewayStatus.OPEN) return;

    this.send({
      op: GatewayOpcodes.SubscribeUser,
      d: { userId },
    });
  }

  unsubscribeUser(userId: string) {
    this.subscribedUserIds.delete(userId);
    if (this.readyState !== GatewayStatus.OPEN) return;

    this.send({
      op: GatewayOpcodes.UnsubscribeUser,
      d: { userId },
    });
  }

  private resubscribeUsers() {
    if (this.readyState !== GatewayStatus.OPEN) return;

    for (const userId of this.subscribedUserIds) {
      this.send({
        op: GatewayOpcodes.SubscribeUser,
        d: { userId },
      });
    }
  }

  sendPresenceUpdate(
    presence: PresenceUpdateDraft,
    opts?: { persist?: boolean },
  ) {
    this.send({
      op: GatewayOpcodes.PresenceUpdate,
      d: { presence, persist: !!opts?.persist },
    });
  }

  setCustomStatus(
    text: string,
    opts?: { persist?: boolean; emoji?: PresenceActivityEmoji | null },
  ) {
    this.app.customStatus.set(text, opts?.emoji);
    this.pushCustomStatusPresenceUpdate({ persist: Boolean(opts?.persist) });
  }

  clearCustomStatus() {
    this.app.customStatus.clear();
    this.pushCustomStatusPresenceUpdate();
  }

  scheduleCustomStatus(opts: {
    text: string;
    emoji?: PresenceActivityEmoji | null;
    durationMs: number;
  }) {
    this.send({
      op: GatewayOpcodes.CustomStatusScheduleSet,
      d: {
        text: opts.text,
        emoji: opts.emoji ?? null,
        durationMs: opts.durationMs,
      },
    });
  }

  clearScheduledCustomStatus() {
    this.send({
      op: GatewayOpcodes.CustomStatusScheduleClear,
      d: {},
    });
  }

  private pushCustomStatusPresenceUpdate(opts?: { persist?: boolean }) {
    const userId = this.app.account?.id;
    if (!userId) return;

    const customActivity = this.app.customStatus.activity;
    const status = this.getEffectiveStatus();
    const prev = this.app.presence.get(userId);

    const draft: PresenceUpdateDraft = {
      status,
      device: "mobile",
      activities: customActivity
        ? [
            customActivity,
            ...(prev?.activities?.filter((a) => a.type !== "custom") ?? []),
          ]
        : (prev?.activities?.filter((a) => a.type !== "custom") ?? []),
    };

    this.lastPresenceHash = null;
    this.sendPresenceUpdate(draft, opts);
  }

  private getEffectiveStatus(): PresenceStatus {
    const userId = this.app.account?.id;
    if (!userId) return "online";

    const scheduled = this.app.presence.scheduledStatus;
    if (scheduled && scheduled.until > Date.now()) return scheduled.status;

    return this.app.presence.get(userId)?.status ?? "online";
  }

  private setupListeners() {
    this.socket!.onopen = this.onOpen;
    this.socket!.onmessage = this.onMessage;
    this.socket!.onerror = this.onError;
    this.socket!.onclose = this.onClose;
  }

  private setupDispatchHandlers() {
    // Connection
    this.dispatchHandlers.set(GatewayDispatchEvents.Ready, this.onReady);
    this.dispatchHandlers.set(GatewayDispatchEvents.Resume, this.onResume);

    // User
    this.dispatchHandlers.set(
      GatewayDispatchEvents.UserUpdate,
      this.onUserUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.UserSettingsUpdate,
      this.onUserSettingsUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.UserProfileUpdate,
      this.onUserProfileUpdate,
    );

    // Spaces
    this.dispatchHandlers.set(
      GatewayDispatchEvents.SpaceCreate,
      this.onSpaceCreate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.SpaceDelete,
      this.onSpaceDelete,
    );

    // Channels
    this.dispatchHandlers.set(
      GatewayDispatchEvents.ChannelCreate,
      this.onChannelCreate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.ChannelUpdate,
      this.onChannelUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.ChannelUpdateBulk,
      this.onChannelUpdateBulk,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.ChannelDeleteBulk,
      this.onChannelDeleteBulk,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.ChannelDelete,
      this.onChannelDelete,
    );

    // Messages
    this.dispatchHandlers.set(
      GatewayDispatchEvents.MessageCreate,
      this.onMessageCreate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.MessageUpdate,
      this.onMessageUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.MessageDelete,
      this.onMessageDelete,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.MessageReactionAdd,
      this.onMessageReactionAdd,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.MessageReactionRemove,
      this.onMessageReactionRemove,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.MessageReactionRemoveAll,
      this.onMessageReactionRemoveAll,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.MessageReactionRemoveEmoji,
      this.onMessageReactionRemoveEmoji,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.MessageAck,
      this.onMessageAck,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.MessageAckBulk,
      this.onMessageAckBulk,
    );

    // Invites
    this.dispatchHandlers.set(
      GatewayDispatchEvents.InviteCreate,
      this.onInviteCreate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.InviteDelete,
      this.onInviteDelete,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.InviteUpdate,
      this.onInviteUpdate,
    );

    // Members
    this.dispatchHandlers.set(
      GatewayDispatchEvents.SpaceMemberAdd,
      this.onSpaceMemberAdd,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.SpaceMemberRemove,
      this.onSpaceMemberRemove,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.SpaceMemberListUpdate,
      this.onSpaceMemberListUpdate,
    );

    // Roles
    this.dispatchHandlers.set(
      GatewayDispatchEvents.RoleCreate,
      this.onRoleCreate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.RoleUpdate,
      this.onRoleUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.RoleDelete,
      this.onRoleDelete,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.SpaceMemberRoleAdd,
      this.onMemberRoleAdd,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.SpaceMemberRoleRemove,
      this.onMemberRoleRemove,
    );

    // Expressions
    this.dispatchHandlers.set(
      GatewayDispatchEvents.ExpressionCreate,
      this.onExpressionCreate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.ExpressionDelete,
      this.onExpressionDelete,
    );

    this.dispatchHandlers.set(
      GatewayDispatchEvents.RelationshipCreate,
      this.onRelationshipCreate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.RelationshipUpdate,
      this.onRelationshipUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.RelationshipDelete,
      this.onRelationshipDelete,
    );

    this.dispatchHandlers.set(
      GatewayDispatchEvents.ChannelRecipientAdd,
      this.onChannelRecipientAdd,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.ChannelRecipientRemove,
      this.onChannelRecipientRemove,
    );

    this.dispatchHandlers.set(
      GatewayDispatchEvents.TypingStart,
      this.onTypingStart,
    );

    this.dispatchHandlers.set(
      GatewayDispatchEvents.PresenceUpdate,
      this.onPresenceUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.PresenceScheduleUpdate,
      this.onPresenceScheduleUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.CustomStatusScheduleUpdate,
      this.onCustomStatusScheduleUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.VoiceStateSync,
      this.onVoiceStateSync,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.VoiceStateUpdate,
      this.onVoiceStateUpdate,
    );
  }

  private onOpen = () => {
    this.logger.debug(
      `[Connected] ${this.url} (took ${Date.now() - this.connectionStartTime!}ms)`,
    );
    this.readyState = GatewayStatus.OPEN;
    this.reconnectTimeout = 0;

    if (this.sessionId) {
      this.logger.debug("[Gateway] Resuming session");
      this.handleResume();
    } else {
      this.logger.debug("[Gateway] Identifying");
      this.handleIdentify();
    }
  };

  private onMessage = async (e: MessageEvent) => {
    try {
      let bytes: Uint8Array;

      if (typeof e.data === "string") {
        bytes = new TextEncoder().encode(e.data);
      } else if (e.data instanceof ArrayBuffer) {
        bytes = new Uint8Array(e.data);
      } else if (e.data instanceof Blob) {
        const ab = await e.data.arrayBuffer();
        bytes = new Uint8Array(ab);
      } else {
        this.logger.error("Unknown message data type");
        return;
      }

      if (this.compress !== "none") bytes = this.compressor.decompress(bytes);

      const data = this.codec.decode(bytes);

      this.handlePayload(data);
    } catch (err) {
      this.logger.error("Failed to decompress message", err);
    }
  };

  private handlePayload = (payload: any) => {
    if (payload.op !== GatewayOpcodes.Dispatch) {
      this.logger.debug(`[Gateway] -> ${payload.op}`);
    }

    switch (payload.op) {
      case GatewayOpcodes.Dispatch:
        this.handleDispatch(payload);
        break;
      case GatewayOpcodes.Heartbeat:
        this.sendHeartbeat();
        break;
      case GatewayOpcodes.Reconnect:
        this.handleReconnect();
        break;
      case GatewayOpcodes.InvalidSession:
        this.handleInvalidSession(payload.d);
        break;
      case GatewayOpcodes.Hello:
        this.handleHello(payload.d);
        break;
      case GatewayOpcodes.HeartbeatAck:
        this.handleHeartbeatAck();
        break;
      default:
        this.logger.debug("Received unknown opcode");
        break;
    }
  };

  private onError = (e: Event) => {
    this.logger.error(`[Socket Error]`, e);
  };

  private onClose = (e: CloseEvent) => {
    this.readyState = GatewayStatus.CLOSED;
    this.handleClose(e.code, e.reason);
  };

  private send = async (payload: any) => {
    if (!this.socket) {
      this.logger.error("Socket is not open");
      return;
    }
    if (this.socket.readyState !== WebSocket.OPEN) {
      this.logger.error(
        `Socket is not open; readyState: ${this.socket.readyState}`,
      );
      return;
    }

    const raw: any = this.codec.encode(payload);

    const out =
      this.compress !== "none"
        ? this.compressor.compress(Uint8Array.from(raw))
        : raw;

    try {
      if (this.compress !== "none") this.socket.send(out);
      else this.socket.send(new TextDecoder().decode(raw));

      this.logger.debug(`[Gateway] <- ${payload.op}`);
    } catch (err) {
      this.logger.error("Failed to send message", err);
    }
  };

  private handleIdentify() {
    if (!this.app.token) {
      this.logger.error("Cannot identify, token is not set");
      return;
    }

    this.identifyStartTime = Date.now();

    const payload = {
      op: GatewayOpcodes.Identify,
      d: {
        token: this.app.token,
      },
    };

    this.send(payload);
  }

  private handleInvalidSession = (resumable: boolean) => {
    this.cleanup();

    this.logger.debug(`Received invalid session; Can Resume: ${resumable}`);
    if (!resumable) {
      this.handleIdentify();
      return;
    }

    this.handleResume();
  };

  private handleReconnect() {
    this.cleanup();

    this.logger.debug(`[Gateway] -> Reconnect`);
    this.startReconnect();
  }

  private handleResume() {
    if (!this.app.token || !this.sessionId) {
      this.logger.error("Cannot resume, token or sessionId is not set");
      this.reset();
      this.app.logout();
      return;
    }

    this.send({
      op: GatewayOpcodes.Resume,
      d: {
        token: this.app.token,
        sessionId: this.sessionId,
        seq: this.sequence,
      },
    });

    this.logger.debug(`[Gateway] -> ${GatewayOpcodes.Resume}`, {
      sessionId: this.sessionId,
      seq: this.sequence,
    });
  }

  private handleHello(data: any) {
    this.heartbeatInterval = data.heartbeatInterval;
    this.reconnectTimeout = this.heartbeatInterval!;
    this.logger.info(
      `[Hello] heartbeat interval: ${data.heartbeatInterval} (took ${Date.now() - this.connectionStartTime!}ms)`,
    );
    this.startHeartbeater();
  }

  private handleClose = (code?: number, reason?: string) => {
    this.cleanup();

    if (code === GatewayCloseCodes.NotAuthenticated) return;

    if (this.reconnectTimeout === 0) this.reconnectTimeout = RECONNECT_TIMEOUT;
    else this.reconnectTimeout += RECONNECT_TIMEOUT;

    const reasonSuffix = reason ? ` (${reason})` : "";
    this.logger.debug(
      `Websocket closed with code ${code}${reasonSuffix}; Will reconnect in ${(
        this.reconnectTimeout / 1000
      ).toFixed(2)} seconds.`,
    );

    this.startReconnect();
  };

  private reset = () => {
    this.sessionId = null;
    this.sequence = 0;
    this.readyState = GatewayStatus.CLOSED;
    this.stopPresenceLoop();
  };

  private startHeartbeater = () => {
    if (this.heartbeater) {
      clearInterval(this.heartbeater);
      this.heartbeater = null;
    }

    const heartbeaterFn = () => {
      if (this.heartbeatAck) {
        this.heartbeatAck = false;
        this.sendHeartbeat();
      } else {
        this.handleHeartbeatTimeout();
      }
    };

    this.initialHeartbeatTimeout = setTimeout(
      () => {
        this.initialHeartbeatTimeout = null;
        this.heartbeater = setInterval(heartbeaterFn, this.heartbeatInterval!);
        heartbeaterFn();
      },
      Math.floor(Math.random() * this.heartbeatInterval!),
    );
  };

  private stopHeartbeater = () => {
    if (this.heartbeater) {
      clearInterval(this.heartbeater);
      this.heartbeater = null;
    }

    if (this.initialHeartbeatTimeout) {
      clearTimeout(this.initialHeartbeatTimeout);
      this.initialHeartbeatTimeout = null;
    }
  };

  private handleHeartbeatTimeout = () => {
    this.logger.warn(
      `[Heartbeat ACK Timeout] should reconnect in ${(RECONNECT_TIMEOUT / 1000).toFixed(2)} seconds`,
    );

    this.socket?.close(4009);

    this.cleanup();
    this.reset();

    this.startReconnect();
  };

  private sendHeartbeat = () => {
    const payload = {
      op: GatewayOpcodes.Heartbeat,
      d: this.sequence,
    };
    this.logger.debug("Sending heartbeat");
    this.send(payload);
  };

  private cleanup = () => {
    this.logger.debug("Cleaning up");
    this.stopHeartbeater();
    this.socket = null;
    this.sessionId = null;
  };

  private handleHeartbeatAck = () => {
    this.logger.debug("Received heartbeat ack");
    this.heartbeatAck = true;
  };

  private handleDispatch = (data: any) => {
    const { d, t, s } = data;
    this.logger.debug(`[Gateway] -> ${t}`);
    this.sequence = s;

    const handler = this.dispatchHandlers.get(t);
    if (!handler) {
      this.logger.debug(`No handler for dispatch event ${t}`);
      return;
    }

    handler(d);
  };

  private onResume = () => {
    this.logger.debug("[Resume] Session");
    this.resubscribeUsers();
  };

  private onReady = async (payload: GatewayReadyPayload) => {
    this.logger.info(
      `[Ready] took ${Date.now() - (this.identifyStartTime ?? 0)}ms`,
    );

    const {
      sessionId,
      user,
      themes,
      spaces,
      channels,
      relationships,
      settings,
      expressions,
      readStates,
      mergedPresences,
    } = payload;

    this.sessionId = sessionId;

    this.app.setUser(user, settings);
    this.app.users.add(user);
    this.app.themes.addAll(themes);
    this.app.spaces.addAll(spaces);
    this.app.channels.addAll(channels ?? []);
    this.app.relationships.addAll(relationships ?? []);
    this.app.expressions.addAll(expressions);
    this.app.readStates.addAll(readStates);

    if (mergedPresences) {
      for (const [userId, presence] of Object.entries(mergedPresences)) {
        this.app.presence.upsert(userId, presence);
      }
    }

    this.reconnectTimeout = 0;
    this.resubscribeUsers();
    this.app.setGatewayReady(true);
    this.startPresenceLoop();

    const selfUserId = this.app.account?.id;
    if (selfUserId) {
      this.app.presence.rearmScheduledStatusTimer();
      this.app.customStatus.rearmScheduledCustomStatusTimer();
    }

    const space =
      this.app.spaces.mostRecentSpace || this.app.spaces.positioned[0];

    if (space) this.app.spaces.setActive(space.id);

    this.app.channels.setPreferredActive();
  };

  // Dispatcher Handlers start here
  private onSpaceCreate = (payload: APISpace) => {
    const space = this.app.spaces.add(payload);
    space.members.addAll(payload.members ?? []);
    for (const channel of payload.channels ?? []) {
      space.addChannel(channel);
    }

    this.app.spaces.setActive(space.id);
    this.app.channels.setPreferredActive();
  };

  private onSpaceDelete = (payload: APISpace) => {
    const space = this.app.spaces.get(payload.id);
    if (!space) return;

    for (const channel of space.channels) {
      channel.messages.clear();
      space.removeChannel(channel.id);
    }

    this.app.spaces.remove(payload.id);
    this.lazyRequestChannels.delete(space.id);
    this.app.spaces.setPreferredActive();
    this.app.channels.setPreferredActive();
  };

  private onChannelCreate = (payload: APIChannel) => {
    if (!payload.spaceId) {
      this.app.channels.add(payload);
      return;
    }

    const space = this.app.spaces.get(payload.spaceId);
    if (!space) return;

    const channel = space.addChannel(payload);
    if (!channel) {
      this.logger.error("Failed to add channel to space");
      return;
    }
    this.app.channels.setActive(channel.id);
  };

  private onChannelUpdate = (payload: APIChannel) => {
    const isDM =
      payload.type === ChannelType.DM ||
      payload.type === ChannelType.GroupDM ||
      payload.spaceId == null;

    if (isDM) {
      const existing = this.app.channels.get(payload.id);
      if (existing) existing.update(payload);
      else this.app.channels.add(payload);

      return;
    }

    if (!payload.spaceId) return;

    const space = this.app.spaces.get(payload.spaceId);
    if (!space) return;

    space.updateChannel(payload);
  };

  private onChannelUpdateBulk = (payload: APIChannel[]) => {
    for (const channel of payload) {
      const isDM =
        channel.type === ChannelType.DM ||
        channel.type === ChannelType.GroupDM ||
        channel.spaceId == null;

      if (isDM) {
        const existing = this.app.channels.get(channel.id);
        if (existing) existing.update(channel);
        else this.app.channels.add(channel);
        continue;
      }

      if (!channel.spaceId) continue;
      const space = this.app.spaces.get(channel.spaceId);
      if (!space) continue;
      space.updateChannel(channel);
    }
  };

  private onChannelDelete = (payload: APIChannel) => {
    if (!payload.spaceId) {
      this.app.channels.remove(payload.id);
      return;
    }

    const space = this.app.spaces.get(payload.spaceId);
    if (!space) return;

    space.removeChannel(payload.id);
    this.app.channels.setPreferredActive();
  };

  private onChannelDeleteBulk = (payload: APIChannel[]) => {
    for (const channel of payload) {
      if (!channel.spaceId) {
        this.app.channels.remove(channel.id);
        continue;
      }

      const space = this.app.spaces.get(channel.spaceId);
      if (!space) continue;
      space.removeChannel(channel.id);
    }

    this.app.channels.setPreferredActive();
  };

  private onMessageCreate = async (payload: APIMessage) => {
    let channel = this.app.channels.get(payload.channelId);

    if (!channel) {
      channel = (await this.resolveChannel(payload.channelId)) ?? undefined;
      if (!channel) return;
    }

    this.app.typing.stoppedTyping(payload.channelId, payload.authorId);
    const message = channel.messages.add(payload);
    channel.updateLastMessage(message);
    this.app.queue.handleIncomingMessage(payload);

    if (this.app.channels.activeId === payload.channelId) return;

    const isMentioned = payload.mentions?.some((m) => {
      if (m.type === "user") return m.id === this.app.account?.id;
      if (m.type === "role") {
        const space = this.app.spaces.get(channel.spaceId ?? "");
        const member = space?.members.get(this.app.account!.id);
        return member?.roles?.has(m.id) ?? false;
      }
      return m.type === "everyone" || m.type === "here";
    });

    if (isMentioned && payload.authorId !== this.app.account?.id) {
      const readState = this.app.readStates.get(payload.channelId);
      readState?.incrementMentionCount();
    }
  };

  private onMessageUpdate = (payload: APIMessage) => {
    const channel = this.app.channels.get(payload.channelId);
    if (!channel) return;

    channel.messages.update(payload);
  };

  private onMessageDelete = (payload: APIMessage) => {
    const channel = this.app.channels.get(payload.channelId);
    if (!channel) return;

    channel.messages.remove(payload.id);
  };

  private onMessageReactionAdd = (payload: APIMessageReactionEvent) => {
    if (payload.userId === this.app.account?.id) return;

    const channel = this.app.channels.get(payload.channelId);
    channel?.messages.get(payload.messageId)?.handleReactionAdd(payload);
  };

  private onMessageReactionRemove = (
    payload: APIMessageReactionRemoveEvent,
  ) => {
    if (payload.userId === this.app.account?.id) return;

    const channel = this.app.channels.get(payload.channelId);
    channel?.messages.get(payload.messageId)?.handleReactionRemove(payload);
  };

  private onMessageReactionRemoveAll = (
    payload: APIMessageReactionRemoveAllEvent,
  ) => {
    const channel = this.app.channels.get(payload.channelId);
    channel?.messages.get(payload.messageId)?.handleReactionRemoveAll(payload);
  };

  private onMessageReactionRemoveEmoji = (
    payload: APIMessageReactionRemoveEmojiEvent,
  ) => {
    const channel = this.app.channels.get(payload.channelId);
    channel?.messages
      .get(payload.messageId)
      ?.handleReactionRemoveEmoji(payload);
  };

  private onMessageAck = (payload: {
    channelId: string;
    lastMessageId: string;
  }) => {
    this.app.readStates.updateLocal(payload.channelId, payload.lastMessageId);
  };

  private onMessageAckBulk = (
    payload: {
      channelId: string;
      lastMessageId: string;
    }[],
  ) => {
    for (const state of payload) {
      this.app.readStates.updateLocal(state.channelId, state.lastMessageId);
    }
  };

  private onUserUpdate = (payload: APIUser | APIPrivateUser) => {
    this.app.users.update(payload);

    if (payload.id === this.app.account?.id) {
      this.app.setUser(payload as APIPrivateUser);
    }
  };

  private onUserSettingsUpdate = (payload: APIUserSettings) => {
    this.app.settings?.update(payload);
  };

  private onUserProfileUpdate = (payload: APIUserProfile) => {
    this.app.profiles.update(payload);
    void this.app.queryClient.invalidateQueries({
      queryKey: ["profile-popout", payload.userId],
    });
  };

  private onInviteCreate = (payload: APIInvite) => {
    if (!payload.spaceId || !payload.channelId) return;

    const space = this.app.spaces.get(payload.spaceId);
    if (!space) return;

    space.addInvite(payload);
  };

  private onInviteUpdate = (payload: APIInvite) => {
    if (!payload.spaceId || !payload.channelId) return;

    const space = this.app.spaces.get(payload.spaceId);
    if (!space) return;

    space.updateInvite(payload);
  };

  private onInviteDelete = (payload: {
    spaceId: string;
    channelId: string;
    code: string;
  }) => {
    const space = this.app.spaces.get(payload.spaceId);
    if (!space) return;

    space.removeInvite(payload.code);
  };

  private onSpaceMemberAdd = (payload: any) => {
    const space = this.app.spaces.get(payload.spaceId);
    if (!space) return;

    space.members.add(payload);
  };

  private onSpaceMemberRemove = (payload: {
    spaceId: string;
    userId: string;
  }) => {
    const space = this.app.spaces.get(payload.spaceId);
    if (!space) return;

    space.members.remove(payload.userId);
  };

  // TODO: Add a type later
  private onSpaceMemberListUpdate = (data: any) => {
    const { spaceId } = data;
    const space = this.app.spaces.get(spaceId);

    if (!space) return;

    space.updateMemberList(data);
  };

  private onRoleCreate = (role: APIRole) => {
    const space = this.app.spaces.get(role.spaceId);
    if (!space) return;

    space.roles.add(role);
    space.members.all.forEach((member) => member.invalidateChannelPermCache());
  };

  private onRoleUpdate = (role: APIRole) => {
    const space = this.app.spaces.get(role.spaceId);
    if (!space) return;

    space.roles.update(role);
    space.members.all.forEach((member) => member.invalidateChannelPermCache());
  };

  private onRoleDelete = (role: Pick<APIRole, "id" | "spaceId">) => {
    const space = this.app.spaces.get(role.spaceId);
    if (!space) return;

    space.roles.remove(role.id);
    space.members.all.forEach((member) => member.invalidateChannelPermCache());
  };

  private onMemberRoleAdd = (
    payload: Pick<APIMemberRole, "spaceId" | "userId" | "roleId">,
  ) => {
    const space = this.app.spaces.get(payload.spaceId);
    if (!space) return;

    const member = space.members.get(payload.userId);
    if (!member) return;

    member.roles.add(payload.roleId);
    member.invalidateChannelPermCache();
  };

  private onMemberRoleRemove = (
    payload: Pick<APIMemberRole, "spaceId" | "userId" | "roleId">,
  ) => {
    const space = this.app.spaces.get(payload.spaceId);
    if (!space) return;

    const member = space.members.get(payload.userId);
    if (!member) return;

    member.roles.delete(payload.roleId);
    member.invalidateChannelPermCache();
  };

  private onExpressionCreate = (payload: APIExpression) => {
    if (payload.spaceId) {
      const space = this.app.spaces.get(payload.spaceId);
      if (!space) return;

      space.addExpression(payload);

      return;
    }

    this.app.expressions.add(payload);
  };

  private onExpressionDelete = (
    payload: Pick<APIExpression, "id" | "spaceId">,
  ) => {
    if (payload.spaceId) {
      const space = this.app.spaces.get(payload.spaceId);
      if (!space) return;

      space.removeExpression(payload.id);

      return;
    }

    this.app.expressions.remove(payload.id);
  };

  private onRelationshipCreate = (payload: APIRelationship) => {
    this.app.relationships.add(payload);
  };

  private onRelationshipUpdate = (payload: APIRelationship) => {
    this.app.relationships.update(payload);
  };

  private onRelationshipDelete = (payload: {
    userId: Snowflake;
    otherUserId: Snowflake;
  }) => {
    this.app.relationships.remove(payload.userId, payload.otherUserId);
  };

  private onChannelRecipientAdd = (payload: {
    channelId: Snowflake;
    userId: Snowflake;
    user: APIUser | null;
  }) => {
    const channel = this.app.channels.get(payload.channelId);
    if (!channel) return;

    const user = payload.user
      ? this.app.users.add(payload.user)
      : this.app.users.get(payload.userId);

    if (!user) return;

    channel.addRecipient(user);
  };

  private onChannelRecipientRemove = (payload: {
    channelId: Snowflake;
    userId: Snowflake;
  }) => {
    const channel = this.app.channels.get(payload.channelId);
    if (!channel) return;

    channel.removeRecipient(payload.userId);

    if (payload.userId === this.app.account?.id) {
      this.app.channels.remove(payload.channelId);
      if (this.app.channels.activeId === payload.channelId) {
        this.app.channels.setPreferredActive();
      }
    }
  };

  private onTypingStart = (payload: {
    channelId: Snowflake;
    userId: Snowflake;
  }) => {
    this.app.typing.startedTyping(payload.channelId, payload.userId);
  };

  private onPresenceUpdate = (payload: any) => {
    if (payload?.userId && payload?.presence) {
      this.app.presence.upsert(payload.userId, payload.presence);
      return;
    }

    const list = payload?.presences;
    if (Array.isArray(list)) {
      for (const item of list) {
        if (!item?.userId || !item?.presence) continue;
        this.app.presence.upsert(item.userId, item.presence);
      }
    }
  };

  private onPresenceScheduleUpdate = (payload: any) => {
    const userId = payload?.userId;
    const schedule: PresenceSchedule | null = payload?.schedule ?? null;
    const selfId = this.app.account?.id;
    if (!selfId || !userId || String(userId) !== String(selfId)) return;
    this.app.presence.setScheduledStatus(schedule);
  };

  private onCustomStatusScheduleUpdate = (payload: any) => {
    const userId = payload?.userId;
    const schedule: CustomStatusSchedule | null = payload?.schedule ?? null;
    const selfId = this.app.account?.id;
    if (!selfId || !userId || String(userId) !== String(selfId)) return;
    this.app.customStatus.setScheduledCustomStatus(schedule);
    this.lastPresenceHash = null;
  };

  private handleScheduledCustomStatusExpired = (
    schedule: CustomStatusSchedule,
  ) => {
    const revertTo = schedule.revertTo;
    if (revertTo) this.app.customStatus.setSnapshot(revertTo);
    else this.app.customStatus.clear();

    this.lastPresenceHash = null;
    this.clearScheduledCustomStatus();
    if (!this.socket || this.readyState !== GatewayStatus.OPEN) return;
    this.pushCustomStatusPresenceUpdate();
  };

  private handleScheduledStatusExpired = (schedule: PresenceSchedule) => {
    const userId = this.app.account?.id;
    if (!userId) return;

    const revertTo = schedule.revertTo ?? "online";
    const prev = this.app.presence.get(userId);

    this.app.presence.upsert(userId, {
      ...(prev ?? { activities: [] }),
      status: revertTo,
      device: "mobile",
      updatedAt: Date.now(),
    });

    this.lastPresenceHash = null;
    this.sendPresenceUpdate({
      status: revertTo,
      device: "mobile",
      activities: prev?.activities ?? [],
    });
  };

  private startPresenceLoop() {
    if (this.presenceLoopInterval) return;

    const tick = () => {
      if (!this.socket || this.readyState !== GatewayStatus.OPEN) return;
      if (!this.app.account?.id) return;

      const draft: PresenceUpdateDraft = {
        status: this.getEffectiveStatus(),
        device: "mobile",
        activities: this.app.customStatus.activity
          ? [this.app.customStatus.activity]
          : [],
      };

      const draftHash = JSON.stringify(draft);
      if (this.lastPresenceHash === draftHash) return;
      this.lastPresenceHash = draftHash;
      this.sendPresenceUpdate(draft);
    };

    this.presenceLoopInterval = setInterval(tick, 15_000);
    tick();
  }

  private stopPresenceLoop() {
    if (this.presenceLoopInterval) {
      clearInterval(this.presenceLoopInterval);
      this.presenceLoopInterval = null;
    }
    this.lastPresenceHash = null;
  }

  private onVoiceStateSync = (payload: {
    channelId: Snowflake;
    states: any[];
  }) => {
    this.app.voice.onVoiceStateSync(payload);
  };

  private onVoiceStateUpdate = (payload: any) => {
    this.app.voice.onVoiceStateUpdate(payload);
  };
}
