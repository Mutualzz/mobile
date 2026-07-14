import { Logger } from "@mutualzz/logger";
import { BitField, userFlags } from "@mutualzz/bitfield";
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
  type APIPost,
  type APIPostComment,
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
  type PresenceActivity,
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
import type { NativeEventSubscription } from "react-native";
import { AppState, Alert, type AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppStore } from "./App.store";
import type { Channel } from "./objects/Channel";
import { fixConnectionUrl } from "@utils/urls";
import { openWebSocket } from "@utils/openWebSocket";
import i18n from "../i18n";

export const GatewayStatus = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export type GatewayStatus = (typeof GatewayStatus)[keyof typeof GatewayStatus];

const RECONNECT_TIMEOUT = 5000;
const RESUME_STORAGE_KEY = "mutualzz:gateway:resume";
const RESUME_MAX_AGE_MS = 110_000;

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
  private reconnectTimer: Timer | null = null;
  private shouldReconnect = true;
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
  private backgroundedAt: number | null = null;
  private backgroundPresenceStatus: PresenceStatus | null = null;
  private foregroundProbeTimer: Timer | null = null;
  private foregroundProbeResolve: ((acked: boolean) => void) | null = null;
  private readonly appStateSubscription: NativeEventSubscription;

  constructor(private readonly app: AppStore) {
    makeAutoObservable(this);
    this.app.customStatus.onScheduledCustomStatusExpire =
      this.handleScheduledCustomStatusExpired;
    this.app.presence.onScheduledStatusExpire =
      this.handleScheduledStatusExpired;
    this.appStateSubscription = AppState.addEventListener(
      "change",
      this.handleAppStateChange,
    );
    void this.restoreResumeState();
  }

  private async restoreResumeState() {
    try {
      const raw = await AsyncStorage.getItem(RESUME_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        sessionId?: string;
        sequence?: number;
        savedAt?: number;
      };
      if (
        !parsed.sessionId ||
        typeof parsed.sequence !== "number" ||
        typeof parsed.savedAt !== "number"
      ) {
        await AsyncStorage.removeItem(RESUME_STORAGE_KEY);
        return;
      }
      if (Date.now() - parsed.savedAt > RESUME_MAX_AGE_MS) {
        await AsyncStorage.removeItem(RESUME_STORAGE_KEY);
        return;
      }
      this.sessionId = parsed.sessionId;
      this.sequence = parsed.sequence;
    } catch {
      await AsyncStorage.removeItem(RESUME_STORAGE_KEY).catch(() => null);
    }
  }

  private persistResumeState() {
    if (!this.sessionId) {
      void AsyncStorage.removeItem(RESUME_STORAGE_KEY);
      return;
    }
    void AsyncStorage.setItem(
      RESUME_STORAGE_KEY,
      JSON.stringify({
        sessionId: this.sessionId,
        sequence: this.sequence,
        savedAt: Date.now(),
      }),
    );
  }

  private clearResumeState() {
    void AsyncStorage.removeItem(RESUME_STORAGE_KEY);
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

    this.teardownSocket();
    this.shouldReconnect = true;
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

  async disconnect(code = 1000, reason?: string) {
    this.shouldReconnect = false;
    this.clearReconnect();
    this.clearForegroundProbe();

    if (this.socket) {
      this.readyState = GatewayStatus.CLOSING;
      this.logger.debug(`[Disconnect] ${this.url}`);
      try {
        this.socket.close(code, reason);
      } catch {}
    }

    this.teardownSocket();
    this.url = undefined;
    this.reset();
  }

  private clearReconnect = () => {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnecting = false;
  };

  startReconnect() {
    if (!this.shouldReconnect) return;
    if (this.reconnecting) return;

    this.reconnecting = true;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnecting = false;
      this.logger.debug(`[Reconnect] ${this.url}`);
      this.connect(this.url);
    }, this.reconnectTimeout);
  }

  private handleAppStateChange = (nextState: AppStateStatus) => {
    if (nextState === "background" || nextState === "inactive") {
      this.backgroundedAt = Date.now();
      this.persistResumeState();

      const userId = this.app.account?.id;
      if (
        userId &&
        this.readyState === GatewayStatus.OPEN &&
        !this.backgroundPresenceStatus
      ) {
        const current = this.app.presence.get(userId)?.status ?? "online";
        if (
          current !== "idle" &&
          current !== "offline" &&
          current !== "invisible" &&
          current !== "dnd"
        ) {
          this.backgroundPresenceStatus = current;
          this.setStatus("idle");
        }
      }

      return;
    }

    if (nextState === "active") {
      if (this.backgroundPresenceStatus) {
        this.setStatus(this.backgroundPresenceStatus);
        this.backgroundPresenceStatus = null;
      }

      void this.handleForeground();
    }
  };

  private clearForegroundProbe() {
    if (this.foregroundProbeTimer) {
      clearTimeout(this.foregroundProbeTimer);
      this.foregroundProbeTimer = null;
    }
    this.foregroundProbeResolve = null;
  }

  private teardownSocket() {
    this.stopHeartbeater();
    this.clearForegroundProbe();

    if (!this.socket) {
      this.readyState = GatewayStatus.CLOSED;
      return;
    }

    const socket = this.socket;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;

    try {
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close(4000, "reconnect");
      }
    } catch {}

    this.socket = null;
    this.readyState = GatewayStatus.CLOSED;
  }

  private forceReconnect() {
    if (!this.app.token) return;

    this.logger.debug("[Foreground] Forcing gateway reconnect");
    this.app.setGatewayReady(false);
    this.clearReconnect();
    this.shouldReconnect = true;
    this.teardownSocket();
    void this.connect();
  }

  private probeConnection(timeoutMs: number) {
    return new Promise<boolean>((resolve) => {
      if (
        !this.socket ||
        this.socket.readyState !== WebSocket.OPEN ||
        this.readyState !== GatewayStatus.OPEN
      ) {
        resolve(false);
        return;
      }

      this.clearForegroundProbe();
      this.foregroundProbeResolve = resolve;
      this.heartbeatAck = false;
      this.sendHeartbeat();

      this.foregroundProbeTimer = setTimeout(() => {
        this.foregroundProbeTimer = null;
        const done = this.foregroundProbeResolve;
        this.foregroundProbeResolve = null;
        done?.(this.heartbeatAck);
      }, timeoutMs);
    });
  }

  private restartHeartbeater() {
    if (!this.heartbeatInterval) return;
    this.stopHeartbeater();
    this.heartbeatAck = true;
    this.startHeartbeater();
  }

  private async handleForeground() {
    if (!this.app.token) return;

    this.backgroundedAt = null;

    const socketOpen =
      !!this.socket &&
      this.socket.readyState === WebSocket.OPEN &&
      this.readyState === GatewayStatus.OPEN;

    if (!socketOpen) {
      this.forceReconnect();
      return;
    }

    const probeTimeout = Math.min(this.heartbeatInterval ?? 30_000, 10_000);
    const acked = await this.probeConnection(probeTimeout);

    if (!acked) {
      this.forceReconnect();
      return;
    }

    this.restartHeartbeater();
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
    this.lazyRequestChannels.set(spaceId, [...spaceChannels, channelId]);

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

  setStatus(status: PresenceStatus, opts?: { persist?: boolean }) {
    const userId = this.app.account?.id;
    if (!userId) return;

    const prev = this.app.presence.get(userId);

    this.app.presence.upsert(userId, {
      ...(prev ?? { activities: [] }),
      status,
      device: "mobile",
      updatedAt: Date.now(),
    });

    this.sendPresenceUpdate(
      {
        status,
        device: "mobile",
        activities: prev?.activities?.filter((a) => a.type === "custom") ?? [],
      },
      { persist: Boolean(opts?.persist) },
    );
  }

  scheduleStatus(opts: { status: PresenceStatus; durationMs: number }) {
    this.send({
      op: GatewayOpcodes.PresenceScheduleSet,
      d: {
        status: opts.status,
        durationMs: opts.durationMs,
      },
    });
  }

  clearScheduledStatus() {
    this.send({
      op: GatewayOpcodes.PresenceScheduleClear,
      d: {},
    });
  }

  sendVoiceStateUpdate(payload: {
    spaceId: Snowflake | null;
    channelId: Snowflake | null;
    selfMute: boolean;
    selfDeaf: boolean;
    refreshRtc?: boolean;
    client?: "desktop" | "mobile" | "web" | "minecraft";
  }) {
    this.send({
      op: GatewayOpcodes.VoiceStateUpdate,
      d: payload,
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

    const draft: PresenceUpdateDraft = {
      status,
      device: "mobile",
      activities: customActivity ? [customActivity] : [],
    };

    this.lastPresenceHash = null;
    this.sendPresenceUpdate(draft, opts);
  }

  private getEffectiveStatus(): PresenceStatus {
    const userId = this.app.account?.id;
    if (!userId) return "online";

    const scheduled = this.app.presence.scheduledStatus;
    if (scheduled && scheduled.until > Date.now()) return scheduled.status;

    const status = this.app.presence.get(userId)?.status ?? "online";
    if (status === "offline") return "online";
    return status;
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
    this.dispatchHandlers.set(
      GatewayDispatchEvents.SpaceUpdate,
      this.onSpaceUpdate,
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
      GatewayDispatchEvents.MinecraftLinkUpdate,
      this.onMinecraftLinkUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.BridgeChat,
      this.onBridgeChat,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.BridgeJoin,
      this.onBridgeJoin,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.BridgeLeave,
      this.onBridgeLeave,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.BridgeVoiceJoin,
      this.onBridgeVoiceJoin,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.BridgeVoiceLeave,
      this.onBridgeVoiceLeave,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.BridgePresence,
      this.onBridgePresence,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.BridgeMemberAdd,
      this.onBridgeMemberAdd,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.BridgeMemberRemove,
      this.onBridgeMemberRemove,
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
      GatewayDispatchEvents.VoiceServerUpdate,
      this.onVoiceServerUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.VoiceStateSync,
      this.onVoiceStateSync,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.VoiceStateUpdate,
      this.onVoiceStateUpdate,
    );

    this.dispatchHandlers.set(
      GatewayDispatchEvents.PostCreate,
      this.onPostCreate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.PostUpdate,
      this.onPostUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.PostDelete,
      this.onPostDelete,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.PostCommentCreate,
      this.onPostCommentCreate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.PostCommentUpdate,
      this.onPostCommentUpdate,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.PostCommentDelete,
      this.onPostCommentDelete,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.PostLikeAdd,
      this.onPostLikeAdd,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.PostLikeRemove,
      this.onPostLikeRemove,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.PostShareAdd,
      this.onPostShareAdd,
    );
    this.dispatchHandlers.set(
      GatewayDispatchEvents.PostShareRemove,
      this.onPostShareRemove,
    );
  }

  private onOpen = () => {
    this.logger.debug(
      `[Connected] ${this.url} (took ${Date.now() - this.connectionStartTime!}ms)`,
    );
    this.readyState = GatewayStatus.OPEN;
    this.reconnectTimeout = 0;

    if (this.sessionId && this.app.account) {
      this.logger.debug("[Gateway] Resuming session");
      this.handleResume();
    } else {
      if (this.sessionId && !this.app.account) {
        this.logger.debug(
          "[Gateway] Resume state without local data; identifying",
        );
        this.sessionId = null;
        this.sequence = 0;
        this.clearResumeState();
      }
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
    this.stopHeartbeater();
    this.app.setGatewayReady(false);

    this.logger.debug(`Received invalid session; Can Resume: ${resumable}`);
    if (!resumable) {
      this.reset();
      this.handleIdentify();
      return;
    }

    this.handleResume();
  };

  private handleReconnect() {
    this.app.setGatewayReady(false);
    this.logger.debug(`[Gateway] -> Reconnect`);
    this.teardownSocket();
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
    this.stopHeartbeater();
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
    }
    this.socket = null;
    this.readyState = GatewayStatus.CLOSED;
    this.app.setGatewayReady(false);

    if (code === GatewayCloseCodes.ForceLogout) {
      this.reset();
      void this.app.logout();
      return;
    }

    if (code === GatewayCloseCodes.NotAuthenticated) return;

    if (!this.shouldReconnect) return;

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
    this.backgroundPresenceStatus = null;
    this.lazyRequestChannels.clear();
    this.memberListRanges.clear();
    this.subscribedUserIds.clear();
    this.stopPresenceLoop();
    this.clearResumeState();
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

    this.app.setGatewayReady(false);
    this.teardownSocket();
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
    this.readyState = GatewayStatus.CLOSED;
  };

  private handleHeartbeatAck = () => {
    this.logger.debug("Received heartbeat ack");
    this.heartbeatAck = true;

    if (this.foregroundProbeResolve) {
      const done = this.foregroundProbeResolve;
      this.foregroundProbeResolve = null;
      if (this.foregroundProbeTimer) {
        clearTimeout(this.foregroundProbeTimer);
        this.foregroundProbeTimer = null;
      }
      done(true);
    }
  };

  private handleDispatch = (data: any) => {
    const { d, t, s } = data;
    this.logger.debug(`[Gateway] -> ${t}`);
    this.sequence = s;
    this.persistResumeState();

    const handler = this.dispatchHandlers.get(t);
    if (!handler) {
      this.logger.debug(`No handler for dispatch event ${t}`);
      return;
    }

    handler(d);
  };

  private onResume = () => {
    this.logger.debug("[Resume] Session");

    if (!this.app.account) {
      this.logger.warn(
        "[Resume] No local session data; falling back to Identify",
      );
      this.sessionId = null;
      this.sequence = 0;
      this.clearResumeState();
      this.handleIdentify();
      return;
    }

    this.resubscribeUsers();
    this.app.setGatewayReady(true);
    this.startPresenceLoop();
    this.app.voice.onGatewayReconnected();
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
      presenceSchedule,
      customStatusSchedule,
    } = payload;

    this.sessionId = sessionId;
    this.persistResumeState();

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

    this.app.presence.setScheduledStatus(presenceSchedule ?? null);
    this.app.customStatus.setScheduledCustomStatus(
      customStatusSchedule ?? null,
    );

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
    this.app.voice.onGatewayReconnected();
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

  private onSpaceUpdate = (payload: APISpace) => {
    const space = this.app.spaces.get(payload.id);
    if (space) {
      space.update(payload);
      return;
    }

    this.app.spaces.add(payload);
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

    if (payload.authorId === this.app.account?.id) {
      this.app.readStates.updateLocal(payload.channelId, payload.id);
      return;
    }

    if (this.app.channels.activeId === payload.channelId) {
      this.app.readStates.updateLocal(payload.channelId, payload.id);
      return;
    }

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
    lastAckedId?: string;
    mentionCount: number;
  }) => {
    const readState = this.app.readStates.get(payload.channelId);
    if (readState) {
      readState.mergeFromServer({
        channelId: payload.channelId,
        lastMessageId: payload.lastMessageId,
        lastAckedId: payload.lastAckedId ?? payload.lastMessageId,
        mentionCount: payload.mentionCount ?? 0,
      } as any);
    } else {
      this.app.readStates.updateLocal(payload.channelId, payload.lastMessageId);
    }
  };

  private onMessageAckBulk = (
    payload: {
      channelId: string;
      lastMessageId: string;
      lastAckedId?: string;
      mentionCount: number;
    }[],
  ) => {
    for (const state of payload) {
      const readState = this.app.readStates.get(state.channelId);
      if (readState) {
        readState.mergeFromServer({
          channelId: state.channelId,
          lastMessageId: state.lastMessageId,
          lastAckedId: state.lastAckedId ?? state.lastMessageId,
          mentionCount: state.mentionCount ?? 0,
        } as any);
      } else {
        this.app.readStates.updateLocal(state.channelId, state.lastMessageId);
      }
    }
  };

  private onUserUpdate = (payload: APIUser | APIPrivateUser) => {
    this.app.users.update(payload);

    if (payload.id === this.app.account?.id) {
      const flags = BitField.fromString(userFlags, payload.flags.toString());

      if (flags.has("Disabled") || flags.has("Deleted")) {
        void this.app.logout();
        return;
      }

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
    this.app.relationships.update(payload);
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

  private onMinecraftLinkUpdate = (
    payload: {
      minecraftUuid: string;
      minecraftName: string;
      discordId: string | null;
      createdAt: string | Date;
    } | null,
  ) => {
    this.app.queryClient.setQueryData(["me", "bridges", "link"], payload);
  };

  private onBridgeMemberAdd = (payload: {
    bridgeId: string;
    name?: string;
    role?: "owner" | "member";
  }) => {
    void this.app.queryClient.invalidateQueries({ queryKey: ["me", "bridges"] });
    if (payload.name) {
      Alert.alert(
        i18n.t("minecraftBridge.joinedToast", {
          ns: "settings",
          name: payload.name,
        }),
      );
    }
  };

  private onBridgeMemberRemove = (payload: { bridgeId: string }) => {
    this.app.queryClient.setQueryData<Array<{ id: string }>>(
      ["me", "bridges"],
      (prev) => (prev ?? []).filter((b) => b.id !== payload.bridgeId),
    );
    this.app.queryClient.removeQueries({
      queryKey: ["me", "bridges", payload.bridgeId],
    });
    this.app.bridgeChat.clear(payload.bridgeId);
    void this.app.queryClient.invalidateQueries({ queryKey: ["me", "bridges"] });
  };

  private onBridgeChat = (payload: {
    id: string;
    bridgeId: string;
    serverId: string;
    source: "minecraft" | "discord" | "app";
    name: string;
    content: string;
    uuid?: string;
    userId?: string;
    avatarUrl?: string;
    at: string;
  }) => {
    this.app.bridgeChat.add({ ...payload, kind: "chat" });
  };

  private onBridgeJoin = (payload: {
    id: string;
    bridgeId: string;
    serverId: string;
    source: "minecraft" | "discord" | "app";
    name: string;
    uuid?: string;
    userId?: string;
    at: string;
  }) => {
    this.app.bridgeChat.add({ ...payload, kind: "join" });
  };

  private onBridgeLeave = (payload: {
    id: string;
    bridgeId: string;
    serverId: string;
    source: "minecraft" | "discord" | "app";
    name: string;
    uuid?: string;
    userId?: string;
    at: string;
  }) => {
    this.app.bridgeChat.add({ ...payload, kind: "leave" });
  };

  private onBridgeVoiceJoin = (payload: {
    id: string;
    bridgeId: string;
    serverId: string;
    source: "minecraft" | "discord" | "app";
    name: string;
    uuid?: string;
    userId?: string;
    channelName?: string;
    at: string;
  }) => {
    this.app.bridgeChat.add({
      ...payload,
      kind: "voice_join",
      content: payload.channelName,
    });
  };

  private onBridgeVoiceLeave = (payload: {
    id: string;
    bridgeId: string;
    serverId: string;
    source: "minecraft" | "discord" | "app";
    name: string;
    uuid?: string;
    userId?: string;
    channelName?: string;
    at: string;
  }) => {
    this.app.bridgeChat.add({
      ...payload,
      kind: "voice_leave",
      content: payload.channelName,
    });
  };

  private onBridgePresence = (payload: {
    bridgeId: string;
    players: { uuid: string; name: string; serverId: string }[];
  }) => {
    this.app.bridgeChat.setPlayers(payload.bridgeId, payload.players);
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

  private trackableActivityFingerprint(
    presence?: { activities?: PresenceActivity[] } | null,
  ) {
    return (presence?.activities ?? [])
      .filter((a) => a.type === "playing" || a.type === "listening")
      .map((a) => `${a.type}|${a.applicationId ?? ""}|${a.name}`)
      .sort()
      .join("\0");
  }

  private scheduleRecentActivitiesRefresh(userId: string) {
    setTimeout(() => {
      void this.app.queryClient.invalidateQueries({
        queryKey: ["user-recent-activities", String(userId)],
      });
    }, 800);
  }

  private onPresenceUpdate = (payload: any) => {
    if (payload?.userId && payload?.presence) {
      const prevFingerprint = this.trackableActivityFingerprint(
        this.app.presence.get(payload.userId),
      );
      this.app.presence.upsert(payload.userId, payload.presence);

      const selfId = this.app.account?.id;
      if (selfId && String(payload.userId) === String(selfId)) {
        const custom =
          payload.presence.activities?.find(
            (a: PresenceActivity) => a.type === "custom",
          ) ?? null;
        this.app.customStatus.syncFromPresenceActivity(custom);
      }

      const nextFingerprint = this.trackableActivityFingerprint(
        payload.presence,
      );
      if (prevFingerprint !== nextFingerprint) {
        this.scheduleRecentActivitiesRefresh(payload.userId);
      }
      return;
    }

    const list = payload?.presences;
    if (Array.isArray(list)) {
      for (const item of list) {
        if (!item?.userId || !item?.presence) continue;
        const prevFingerprint = this.trackableActivityFingerprint(
          this.app.presence.get(item.userId),
        );
        this.app.presence.upsert(item.userId, item.presence);
        const nextFingerprint = this.trackableActivityFingerprint(
          item.presence,
        );
        if (prevFingerprint !== nextFingerprint) {
          this.scheduleRecentActivitiesRefresh(item.userId);
        }
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
    if (!schedule) this.pushCustomStatusPresenceUpdate();
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
    this.clearScheduledStatus();

    if (!this.socket || this.readyState !== GatewayStatus.OPEN) return;

    this.sendPresenceUpdate({
      status: revertTo,
      device: "mobile",
      activities: prev?.activities?.filter((a) => a.type === "custom") ?? [],
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

  private onVoiceServerUpdate = (payload: {
    roomId?: string;
    spaceId?: Snowflake | null;
    channelId: Snowflake;
    voiceEndpoint: string;
    voiceToken: string;
    sessionId: string;
  }) => {
    this.app.voice.onVoiceServerUpdate(payload);
  };

  private onVoiceStateUpdate = (payload: any) => {
    this.app.voice.onVoiceStateUpdate(payload);
  };

  private onPostCreate = (payload: APIPost) => {
    this.app.posts.add(payload);
  };

  private onPostUpdate = (payload: APIPost) => {
    this.app.posts.update(payload);
  };

  private onPostDelete = (payload: Pick<APIPost, "id">) => {
    this.app.posts.remove(payload.id);
  };

  private onPostCommentCreate = (payload: APIPostComment) => {
    const post = this.app.posts.get(payload.postId);
    if (!post) return;

    const alreadyHave = post.comments.has(payload.id);
    post.comments.add(payload);
    if (!alreadyHave) post.bumpCommentCount(1);
  };

  private onPostCommentUpdate = (payload: APIPostComment) => {
    const post = this.app.posts.get(payload.postId);
    if (!post) return;

    post.comments.update(payload);
  };

  private onPostCommentDelete = (
    payload: Pick<APIPostComment, "id" | "postId">,
  ) => {
    const post = this.app.posts.get(payload.postId);
    if (!post) return;

    if (post.comments.has(payload.id)) post.bumpCommentCount(-1);
    post.comments.remove(payload.id);
  };

  private onPostLikeAdd = (payload: { postId: string; userId: string }) => {
    if (payload.userId === this.app.account?.id) return;

    const post = this.app.posts.get(payload.postId);
    if (!post) return;

    post.bumpLikeCount(1);
  };

  private onPostLikeRemove = (payload: { postId: string; userId: string }) => {
    if (payload.userId === this.app.account?.id) return;

    const post = this.app.posts.get(payload.postId);
    if (!post) return;

    post.bumpLikeCount(-1);
  };

  private onPostShareAdd = (payload: { postId: string; userId: string }) => {
    if (payload.userId === this.app.account?.id) return;

    const post = this.app.posts.get(payload.postId);
    if (!post) return;

    post.bumpShareCount(1);
  };

  private onPostShareRemove = (payload: { postId: string; userId: string }) => {
    if (payload.userId === this.app.account?.id) return;

    const post = this.app.posts.get(payload.postId);
    if (!post) return;

    post.bumpShareCount(-1);
  };
}
