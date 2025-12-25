import { Logger } from "@mutualzz/logger";
import type { APIMessage, GatewayReadyPayload } from "@mutualzz/types";
import {
    GatewayCloseCodes,
    GatewayDispatchEvents,
    GatewayOpcodes,
    type APIChannel,
    type APIInvite,
    type APIPrivateUser,
    type APISpace,
    type APIUser,
    type APIUserSettings,
} from "@mutualzz/types";
import { createCodec, type Codec, type Encoding } from "@utils/codec";
import {
    createCompressor,
    type Compression,
    type Compressor,
} from "@utils/compressor";
import { fixConnectionUrl } from "@utils/urls";
import { makeAutoObservable } from "mobx";
import type { AppStore } from "./App.store";

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

type Timer = ReturnType<typeof setTimeout>;

const RECONNECT_TIMEOUT = 5000;

export class GatewayStore {
    socket: WebSocket | null = null;
    private readonly logger = new Logger({
        tag: "GatewayStore",
    });

    public readyState: GatewayStatus = GatewayStatus.CLOSED;
    private sessionId: string | null = null;
    private sequence = 0;

    private heartbeatInterval: number | null = null;
    private heartbeater: Timer | null = null;
    private initialHeartbeatTimeout: Timer | null = null;
    private heartbeatAck = true;
    private url?: string;

    private encoding: Encoding = "json";
    private compress: Compression = "none";

    private codec!: Codec;
    private compressor!: Compressor;

    private connectionStartTime?: number;
    private identifyStartTime?: number;
    private reconnectTimeout = 0;

    private reconnecting = false;

    public events: { t: string; d: any; s: number }[] = [];

    private readonly dispatchHandlers = new Map<
        string,
        (...args: any[]) => any
    >();

    private lazyRequestChannels = new Map<string, string[]>(); // spaceId -> channelIds

    constructor(private readonly app: AppStore) {
        makeAutoObservable(this);
    }

    async connect(_url?: string) {
        let url = fixConnectionUrl(
            _url || process.env.EXPO_PUBLIC_WS_URL || "",
        );

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
        this.socket = new WebSocket(this.url);
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
            GatewayDispatchEvents.BulkChannelUpdate,
            this.onBulkChannelUpdate,
        );
        this.dispatchHandlers.set(
            GatewayDispatchEvents.BulkChannelDelete,
            this.onBulkChannelDelete,
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
            GatewayDispatchEvents.MessageDelete,
            this.onMessageDelete,
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

            if (this.compress !== "none")
                bytes = this.compressor.decompress(bytes);

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
        console.log(e.code, e.reason);
        this.handleClose(e.code);
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

    private handleClose = (code?: number) => {
        this.cleanup();

        if (code === GatewayCloseCodes.NotAuthenticated) return;

        if (this.reconnectTimeout === 0)
            this.reconnectTimeout = RECONNECT_TIMEOUT;
        else this.reconnectTimeout += RECONNECT_TIMEOUT;

        this.logger.debug(
            `Websocket closed with code ${code}; Will reconnect in ${(
                this.reconnectTimeout / 1000
            ).toFixed(2)} seconds.`,
        );

        this.startReconnect();
    };

    private reset = () => {
        this.sessionId = null;
        this.sequence = 0;
        this.readyState = GatewayStatus.CLOSED;
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
                this.heartbeater = setInterval(
                    heartbeaterFn,
                    this.heartbeatInterval!,
                );
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
    };

    private onReady = async (payload: GatewayReadyPayload) => {
        this.logger.info(
            `[Ready] took ${Date.now() - (this.identifyStartTime ?? 0)}ms`,
        );

        const { sessionId, user, themes, spaces, settings } = payload;

        this.sessionId = sessionId;

        this.app.setUser(user, settings);
        this.app.users.add(user);
        this.app.themes.addAll(themes);
        this.app.spaces.addAll(spaces);

        this.reconnectTimeout = 0;
        this.app.setGatewayReady(true);

        const space =
            this.app.spaces.mostRecentSpace || this.app.spaces.positioned[0];

        if (space) this.app.spaces.setActive(space.id);

        this.app.channels.setPreferredActive();
    };

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
        if (!payload.spaceId) return;
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
        if (!payload.spaceId) return;
        const space = this.app.spaces.get(payload.spaceId);
        if (!space) return;

        space.updateChannel(payload);
    };

    private onBulkChannelUpdate = (payload: APIChannel[]) => {
        for (const channel of payload) {
            if (!channel.spaceId) continue;
            const space = this.app.spaces.get(channel.spaceId);
            if (!space) continue;
            space.updateChannel(channel);
        }
    };

    private onChannelDelete = (payload: APIChannel) => {
        if (!payload.spaceId) return;
        const space = this.app.spaces.get(payload.spaceId);
        if (!space) return;

        space.removeChannel(payload.id);
        this.app.channels.setPreferredActive();
    };

    private onBulkChannelDelete = (payload: APIChannel[]) => {
        for (const channel of payload) {
            if (!channel.spaceId) continue;
            const space = this.app.spaces.get(channel.spaceId);
            if (!space) continue;
            space.removeChannel(channel.id);
        }

        this.app.channels.setPreferredActive();
    };

    private onMessageCreate = (payload: APIMessage) => {
        const channel = this.app.channels.get(payload.channelId);
        if (!channel) return;

        channel.messages.add(payload);
        this.app.queue.handleIncomingMessage(payload);
    };

    private onMessageDelete = (payload: APIMessage) => {
        const channel = this.app.channels.get(payload.channelId);
        if (!channel) return;

        channel.messages.remove(payload.id);
    };

    private onUserUpdate = (payload: APIUser | APIPrivateUser) => {
        this.app.users.update(payload as APIUser);

        if (payload.id === this.app.account?.id) {
            this.app.setUser(payload as APIPrivateUser);
        }
    };

    private onUserSettingsUpdate = (payload: APIUserSettings) => {
        this.app.settings?.update(payload);
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
}
